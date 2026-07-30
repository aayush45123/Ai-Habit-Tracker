import express from "express";
import auth from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import User from "../models/User.js";
import {
  saveCalorieProfile,
  getCalorieProfile,
} from "../controllers/calorieController.js";

const router = express.Router();

router.get("/", auth, getCalorieProfile);
router.post("/", auth, saveCalorieProfile);

// Image Upload Endpoint for Profile Picture / Avatar
router.post(
  "/upload-avatar",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = await uploadToCloudinary(req.file.buffer, "avatars");

      await User.findByIdAndUpdate(req.user._id, { profileImage: imageUrl });

      res.json({
        message: "Profile avatar uploaded successfully",
        profileImage: imageUrl,
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ message: "Failed to upload profile image", error: error.message });
    }
  }
);

export default router;
