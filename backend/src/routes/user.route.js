import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  searchUsers,
  sendRequest,
  acceptRequest,
  rejectRequest,
  getRequests,
  getSentRequests,
  getFriends
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.post("/request/:id", protectRoute, sendRequest);
router.post("/accept/:id", protectRoute, acceptRequest);
router.post("/reject/:id", protectRoute, rejectRequest);
router.get("/requests", protectRoute, getRequests);
router.get("/sent-requests", protectRoute, getSentRequests);
router.get("/friends", protectRoute, getFriends);

export default router;
