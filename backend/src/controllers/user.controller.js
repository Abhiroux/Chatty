import User from "../models/user.model.js";

// Search users by name, email or phone
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const loggedInUserId = req.user._id;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const regex = new RegExp(query, "i");
    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { fullName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id: receiverId } = req.params;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ error: "You cannot send request to yourself" });
    }


    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if they are already friends
    if (receiver.friends.includes(senderId)) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Check if request is already sent
    if (receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ error: "Request already sent" });
    }

    // Add to friendRequests of receiver
    receiver.friendRequests.push(senderId);
    await receiver.save();

    // Add to sentFriendRequests of sender
    const sender = await User.findById(senderId);
    sender.sentFriendRequests.push(receiverId);
    await sender.save();

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    console.error("Error in sendRequest", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { id: senderId } = req.params;

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if request exists
    if (!receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ error: "No pending request" });
    }

    // Remove from requests, add to friends
    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId.toString());
    receiver.friends.push(senderId);
    await receiver.save();

    sender.sentFriendRequests = sender.sentFriendRequests.filter(id => id.toString() !== receiverId.toString());
    sender.friends.push(receiverId);
    await sender.save();

    res.status(200).json({ message: "Request accepted successfully", newFriend: sender });
  } catch (error) {
    console.error("Error in acceptRequest", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { id: senderId } = req.params;

    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver || !sender) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if request exists
    if (!receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ error: "No pending request" });
    }

    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId.toString());
    await receiver.save();

    sender.sentFriendRequests = sender.sentFriendRequests.filter(id => id.toString() !== receiverId.toString());
    await sender.save();

    res.status(200).json({ message: "Request rejected successfully" });
  } catch (error) {
    console.error("Error in rejectRequest", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friendRequests", "-password");
    res.status(200).json(user.friendRequests || []);
  } catch (error) {
    console.error("Error in getRequests", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("sentFriendRequests", "-password");
    res.status(200).json(user.sentFriendRequests || []);
  } catch (error) {
    console.error("Error in getSentRequests", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "-password");
    res.status(200).json(user.friends || []);
  } catch (error) {
    console.error("Error in getFriends", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
