import cloudinary from "../lib/cloudinary.js";
import { generateOTP, hashOTP } from "../lib/otp.js";
import { sendOTPEmail } from "../lib/sendEmail.js";
import { sendOTPSMS } from "../lib/sendSMS.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// User signup handler
export const signup = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Validate that at least email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or Phone is required" });
    }

    // Validate password length
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be atleast 6 characters long" });
    }

    // Check if user already exists
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    const existingUser = await User.findOne({
      $or: query,
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP for verification
    const otp = generateOTP();

    // Create new user with unverified status
    const newUser = await User.create({
      fullName,
      email: email ? email : undefined,
      phone: phone ? phone : undefined,
      password: hashedPassword,
      otpHash: hashOTP(otp),
      otpExpireAt: Date.now() + 10 * 60 * 1000,
      isVerified: false,
    });

    // Send OTP via SMS or Email
    if (phone) sendOTPSMS(phone, otp);
    if (email) sendOTPEmail(email, otp);

    res.status(201).json({
      message: "OTP sent successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.log("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User login handler
export const login = async (req, res) => {
  const { phone, email, password } = req.body;
  try {
    // Find user by email or phone
    const user = await User.findOne({
      $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean),
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    // Check if user is verified; if not, send OTP
    if (!user.isVerified) {
      const otp = generateOTP();

      user.otpHash = hashOTP(otp);
      user.otpExpireAt = Date.now() + 10 * 60 * 1000;
      await user.save();

      if (user.phone) sendOTPSMS(user.phone, otp);
      if (user.email) sendOTPEmail(user.email, otp);

      return res.status(403).json({
        message: "Please verify your account first",
        userId: user._id,
      });
    }

    // Generate JWT token and return user data
    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User logout handler - clear JWT cookie
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        message: "User Id and OTP are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    const isOTPValid =
      user.otpHash === hashOTP(otp) && user.otpExpireAt > Date.now();

    if (!isOTPValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpireAt = undefined;
    await user.save();

    generateToken(user._id, res);
    res.status(200).json({
      message: "OTP verified successfully",
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    });
  } catch (error) {
    console.error("OTP verfication error:", error.message);
    res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const otp = generateOTP();
    user.otpHash = hashOTP(otp);
    user.otpExpireAt = Date.now() + 10 * 60 * 1000;

    await user.save();

    if (user.email) await sendOTPEmail(user.email, otp);
    if (user.phone) await sendOTPSMS(user.phone, otp);
    res.status(200).json({ message: "OTP send successfully" });
  } catch (error) {
    console.log("Resend OTP error:", error.message);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// Update user profile picture, full name, or bio
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    if (!profilePic && !fullName && bio === undefined) {
      return res.status(400).json({ message: "No data to update" });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;

    if (profilePic && profilePic.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true },
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestContactUpdate = async (req, res) => {
  try {
    const { newEmail, newPhone } = req.body;
    const userId = req.user._id;

    if (!newEmail && !newPhone) {
      return res.status(400).json({ message: "New email or phone is required" });
    }

    // Check if new email/phone already exists
    const query = [];
    if (newEmail) query.push({ email: newEmail });
    if (newPhone) query.push({ phone: newPhone });
    
    const existingUser = await User.findOne({ $or: query });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    const user = await User.findById(userId);
    const otp = generateOTP();
    user.otpHash = hashOTP(otp);
    user.otpExpireAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    if (newPhone) sendOTPSMS(newPhone, otp);
    if (newEmail) sendOTPEmail(newEmail, otp);

    res.status(200).json({ message: "OTP sent to new contact" });
  } catch (error) {
    console.log("Error in requestContactUpdate", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyContactUpdate = async (req, res) => {
  try {
    const { newEmail, newPhone, otp } = req.body;
    const userId = req.user._id;

    if (!otp || (!newEmail && !newPhone)) {
      return res.status(400).json({ message: "OTP and new contact details are required" });
    }

    const user = await User.findById(userId);

    const isOTPValid =
      user.otpHash === hashOTP(otp) && user.otpExpireAt > Date.now();

    if (!isOTPValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (newEmail) user.email = newEmail;
    if (newPhone) user.phone = newPhone;

    user.otpHash = undefined;
    user.otpExpireAt = undefined;
    await user.save();

    res.status(200).json({
      message: "Contact updated successfully",
      updatedUser: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.log("Error in verifyContactUpdate", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if user is authenticated
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
