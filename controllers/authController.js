// check if email already exists else hash the password and register new user
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import nodemailer from "nodemailer";
import orderModel from "../models/orderModel.js";
import twilio from "twilio";
import dotenv from "dotenv";

//configure
dotenv.config();

/* Twilio whastsapp api(didn't work)*/
//const accountSid = process.env.TWILIO_ACCOUNT_SID;
//const authToken = process.env.TWILIO_AUTH_TOKEN;
//const client = twilio(accountSid, authToken);

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, verified } = req.body;

    //Validations
    if (!name) return res.send({ message: "Name is required" });
    if (!email) return res.send({ message: "Email is required" });
    if (!password || password.length < 6)
      return res.send({ message: "Password is required and 6 character long" });
    if (!address) return res.send({ message: "Address is required" });
    if (!phone) return res.send({ message: "Phone Number is required" });

    //existing users
    const existing_user = await userModel.findOne({ email });
    if (existing_user) {
      return res.status(200).send({
        success: false,
        message: "Email already registered!!",
      });
    }

    //register user
    const hashedPassword = await hashPassword(password);
    const newUser = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
    }).save();

    res.status(200).send({
      success: true,
      message: "User Registered Successfully",
      user: newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Registration",
      error,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(200).send({
        success: false,
        message: "Please enter valid email address!!",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (!existingUser) {
      return res.status(200).send({
        success: false,
        message: "User not registered, Please SignUp!!",
      });
    }
    /*if Email is not verified */
    if (existingUser?.verified == false) {
      return res.status(200).send({
        success: false,
        message: "Verify Email first!!",
      });
    }
    /* if Email is not verified */
    /*  
    /*if phone not verified 
    if (existingUser?.verifiedPhone == false) {
      return res.status(200).send({
        success: false,
        message: "Verify Phone number first!!",
      });
    }
    /*if phone not verified 
  */
    const hashedPassword = existingUser.password;
    const match = await comparePassword(password, hashedPassword);
    if (match === true) {
      //token
      const token = await JWT.sign(
        { _id: existingUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.status(200).send({
        success: true,
        message: `Welcome back!!`,
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          address: existingUser.address,
          role: existingUser.role,
        },
        token,
      });
    } else {
      return res.status(200).send({
        success: false,
        message: `Please enter correct password!!`,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Login!!",
      error,
    });
  }
};

//update profile

export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findOne({ email });

    //password
    if (password && password.length < 6)
      return res.send({
        message: "Password is required and 6 character long!!",
      });
    let hashedPassword = user.password;
    if (password) {
      console.log(password);
      console.log("hello");
      hashedPassword = await hashPassword(password);
    }
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        name: name || user.name,
        password: hashedPassword,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Successully updated user profile!!",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating profile!!",
      error,
    });
  }
};

// forgot password
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User not registered, Please SignUp!!",
      });
    }
    const secret = process.env.JWT_SECRET + user?.password;
    const token = JWT.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "5m",
    });
    const link = `${process.env.REACT_APP_API}/api/v1/auth/reset-password/${user._id}/${token}`;
    /*Node Mailer */
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    /*Node Mailer */
    res.status(200).send({
      success: true,
      message: "Check your email to reset password!!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: "false",
      message: "Error sending reset password link!!",
      error,
    });
  }
};

export const verifyUserController = async (req, res) => {
  try {
    const { id, token } = req.params;
    const user = await userModel.findOne({ _id: id });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User not registered, Please SignUp!!",
      });
    }
    const secret = process.env.JWT_SECRET + user?.password;
    const verify = JWT.verify(token, secret);
    if (verify === false) {
      return res.status(200).send({
        success: false,
        message: "User not verified!!",
      });
    }
    const frontendURL =
      process.env.REACT_APP_SERVER_PORT || "http://localhost:3000";
    res.render("index", {
      email: verify.email,
      status: "NotVerified",
      frontendURL,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error resetting password!!",
      error,
    });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password, confirmPassword } = req.body;
    const user = await userModel.findOne({ _id: id });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User not registered, Please SignUp!!",
      });
    }
    const secret = process.env.JWT_SECRET + user?.password;
    const verify = JWT.verify(token, secret);
    if (verify === false) {
      return res.status(200).send({
        success: false,
        message: "User not verified!!",
      });
    }
    if (!password) {
      return res.status(200).send({
        success: false,
        message: "Password cannot be empty!!",
      });
    }
    if (password !== confirmPassword) {
      return res.status(200).send({
        success: false,
        message: "Password && Confirm Password doesn't match!!",
      });
    }

    if (password && password.length < 6)
      return res.status(200).send({
        success: false,
        message: "Password is required and 6 character long!!",
      });
    const hashedPassword = await hashPassword(password);
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
      },
      { new: true }
    );
    const frontendURL =
      process.env.REACT_APP_SERVER_PORT || "http://localhost:3000";
    res.render("index", {
      email: verify.email,
      status: "verified",
      frontendURL,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error resetting password!!",
      error,
    });
  }
};

// Verify Email
export const verifyEmailLinkController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(200).send({
        success: false,
        message: "Please enter valid email address!!",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User not registered, Please SignUp!!",
      });
    }
    /*Generating Verification Link */
    const secret = process.env.JWT_SECRET + user?.password;
    const token = JWT.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "5m",
    });
    const link = `${process.env.REACT_APP_API}/api/v1/auth/verify-email/${user._id}/${token}`;
    /*Node Mailer */
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    /*Node Mailer */
    /*Generating Verification Link */
    res.status(200).send({
      success: true,
      message: "Check your email to verify email!!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error Generating Email Verification Link!!",
      error,
    });
  }
};

// Verify Email
export const verifyEmailController = async (req, res) => {
  try {
    const { id, token } = req.params;
    const user = await userModel.findOne({ _id: id });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "User not registered, Please SignUp!!",
      });
    }
    const secret = process.env.JWT_SECRET + user?.password;
    const verify = JWT.verify(token, secret);
    if (verify === false) {
      return res.status(200).send({
        success: false,
        message: "User not verified!!",
      });
    }
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        verified: true,
      },
      { new: true }
    );
    const frontendURL =
      process.env.REACT_APP_SERVER_PORT || "http://localhost:3000";
    res.render("verifyEmail", {
      email: verify.email,
      status: "verified",
      frontendURL,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error verifying user!!",
      error,
    });
  }
};

//Get all user orders
export const userOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting user orders!!",
      error,
    });
  }
};

//Get all admin orders
export const adminOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting user orders!!",
      error,
    });
  }
};

export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating order status!!",
      error,
    });
  }
};

export const generateOTPController = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error generating OTP!!",
      error,
    });
  }
};

//Testing purpose controller
export const testController = (req, res) => {
  res.send("protected route");
};
