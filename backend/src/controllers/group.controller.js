import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import User from "../models/user.model.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, groupPic } = req.body;
    const adminId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    if (!memberIds || memberIds.length < 1) {
      return res.status(400).json({ error: "At least 1 member is required besides you" });
    }

    // Ensure admin is included in members
    const allMembers = [...new Set([adminId.toString(), ...memberIds])];

    let groupPicUrl = "";
    if (groupPic && groupPic.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    const group = new Group({
      name: name.trim(),
      description: description || "",
      groupPic: groupPicUrl,
      admin: adminId,
      members: allMembers,
    });

    await group.save();

    // Populate members for the response
    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "-password")
      .populate("members", "-password");

    // Socket: Notify all members they've been added to a group
    allMembers.forEach((memberId) => {
      if (memberId.toString() !== adminId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("addedToGroup", populatedGroup);
        }
      }
    });

    // Join the admin to the socket room immediately
    const adminSocketId = getReceiverSocketId(adminId);
    if (adminSocketId) {
      const adminSocket = io.sockets.sockets.get(adminSocketId);
      if (adminSocket) {
        adminSocket.join(`group:${group._id}`);
      }
    }

    // Join all members to the socket room
    allMembers.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        const memberSocket = io.sockets.sockets.get(socketId);
        if (memberSocket) {
          memberSocket.join(`group:${group._id}`);
        }
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all groups the user is a member of
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get detailed info about a specific group
export const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate("admin", "-password")
      .populate("members", "-password");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member
    if (!group.members.some((m) => m._id.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get messages for a group
export const getGroupMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Verify membership
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const messages = await GroupMessage.find({ groupId: id })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (!group.members.some((m) => m.toString() === senderId.toString())) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    let imageUrl;
    if (image && image.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new GroupMessage({
      groupId,
      senderId,
      text,
      image: imageUrl || image,
    });
    await newMessage.save();

    // Populate sender info for the response
    const populatedMessage = await GroupMessage.findById(newMessage._id).populate(
      "senderId",
      "fullName profilePic"
    );

    // Update group's updatedAt so it sorts to top
    group.updatedAt = new Date();
    await group.save();

    // Socket: Broadcast to all group members except sender
    io.to(`group:${groupId}`).emit("newGroupMessage", {
      ...populatedMessage.toObject(),
      groupId,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update group details (admin only)
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, groupPic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the admin can update group settings" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description;

    if (groupPic && groupPic.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      group.groupPic = uploadResponse.secure_url;
    }

    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("admin", "-password")
      .populate("members", "-password");

    // Notify all members of the update
    io.to(`group:${id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add members to group (admin only)
export const addMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the admin can add members" });
    }

    if (!memberIds || memberIds.length === 0) {
      return res.status(400).json({ error: "No members to add" });
    }

    // Add only new members
    const newMembers = memberIds.filter(
      (mid) => !group.members.some((m) => m.toString() === mid)
    );

    group.members.push(...newMembers);
    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("admin", "-password")
      .populate("members", "-password");

    // Notify new members and join them to the socket room
    newMembers.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("addedToGroup", updatedGroup);
        const memberSocket = io.sockets.sockets.get(socketId);
        if (memberSocket) {
          memberSocket.join(`group:${id}`);
        }
      }
    });

    // Notify existing members of the update
    io.to(`group:${id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in addMembers:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Remove a member from group (admin only)
export const removeMember = async (req, res) => {
  try {
    const { id, userId: memberToRemove } = req.params;
    const adminId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({ error: "Only the admin can remove members" });
    }

    if (memberToRemove === adminId.toString()) {
      return res.status(400).json({ error: "Admin cannot remove themselves. Transfer admin or delete group." });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== memberToRemove
    );
    await group.save();

    // Remove user from socket room
    const removedSocketId = getReceiverSocketId(memberToRemove);
    if (removedSocketId) {
      const removedSocket = io.sockets.sockets.get(removedSocketId);
      if (removedSocket) {
        removedSocket.leave(`group:${id}`);
      }
      io.to(removedSocketId).emit("removedFromGroup", { groupId: id });
    }

    const updatedGroup = await Group.findById(id)
      .populate("admin", "-password")
      .populate("members", "-password");

    io.to(`group:${id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in removeMember:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Leave a group
export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return res.status(400).json({ error: "You are not a member of this group" });
    }

    // If admin leaves, assign new admin or delete group
    if (group.admin.toString() === userId.toString()) {
      const remainingMembers = group.members.filter(
        (m) => m.toString() !== userId.toString()
      );
      if (remainingMembers.length === 0) {
        // Delete group if no members left
        await GroupMessage.deleteMany({ groupId: id });
        await Group.findByIdAndDelete(id);
        io.to(`group:${id}`).emit("groupDeleted", { groupId: id });
        return res.status(200).json({ message: "Group deleted as last member left" });
      }
      // Transfer admin to the first remaining member
      group.admin = remainingMembers[0];
    }

    group.members = group.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    await group.save();

    // Remove from socket room
    const userSocketId = getReceiverSocketId(userId);
    if (userSocketId) {
      const userSocket = io.sockets.sockets.get(userSocketId);
      if (userSocket) {
        userSocket.leave(`group:${id}`);
      }
    }

    const updatedGroup = await Group.findById(id)
      .populate("admin", "-password")
      .populate("members", "-password");

    io.to(`group:${id}`).emit("groupUpdated", updatedGroup);

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error in leaveGroup:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
