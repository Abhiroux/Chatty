import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  createGroup,
  getMyGroups,
  getGroupDetails,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getMyGroups);
router.get("/:id", protectRoute, getGroupDetails);
router.put("/:id", protectRoute, updateGroup);
router.get("/:id/messages", protectRoute, getGroupMessages);
router.post("/:id/messages", protectRoute, sendGroupMessage);
router.post("/:id/members", protectRoute, addMembers);
router.delete("/:id/members/:userId", protectRoute, removeMember);
router.post("/:id/leave", protectRoute, leaveGroup);

export default router;
