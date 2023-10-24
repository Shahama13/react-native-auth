import { User } from "../models/user.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary"
import fs from "fs"

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body

        const avatar = req.files.avatar.tempFilePath;


        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }
        const otp = Math.floor(Math.random() * 9999)

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "auth"
        })

        fs.rmSync("./tmp", { recursive: true })

        user = await User.create({
            name, email, password, avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }, otp, otp_expiry: new Date(Date.now() + 300000)

        })


        await sendMail(email, "Verify your account", `Your OTP is ${otp}`)

        sendToken(res, user, 201, "OTP sent to your email , please verify your account")


    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp)
        const user = await User.findById(req.user._id)
      
        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP or OPT expired"
            })
        }
        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();

        sendToken(res, user, 200, "Accout Verified")

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Enter email and password"
            })
        }

        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        const otp = Math.floor(Math.random() * 9999)
        const isMatch = await user.comparePassword(password)

        if (!isMatch) {
            return res.status(500).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        sendToken(res, user, 200, "User logged in successfully ")

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null, {
            expires: new Date(Date.now())
        }).json({
            success: true,
            messsage: "User logged out successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        // sendToken(res,user,200,"wecome")
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { name } = req.body
        const avatar = req.files.avatar.tempFilePath;
        const user = await User.findById(req.user._id)
        if (avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id)
            const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "auth"
            })
            fs.rmSync("./tmp", { recursive: true })
            user.avatar = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }
        if (name) {
            user.name = name
        }
        await user.save()
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body
        if (newPassword !== confirmPassword) {
            return res.status(500).json({
                success: false,
                message: "Please enter again"
            })
        }

        const user = await User.findById(req.user._id).select("+password")
        const isMatch = await user.comparePassword(oldPassword)
        if (!isMatch) {
            return res.status(500).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        user.password = newPassword
        await user.save()

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(500).json({
                success: false,
                message: "Please enter email"
            })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(500).json({
                success: false,
                message: "User does not exist"
            })
        }

        const otp = Math.floor(Math.random() * 9999)

        user.resetPasswordOtp = otp,
            user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000

        await user.save()

        await sendMail(email, "Request to restPassword", `Your OTP is ${otp}`)

        res.status(200).json({
            success: true,
            message: `Otp send to ${email}`
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body
        if (!otp) {
            return res.status(500).json({
                success: false,
                message: "Please enter otp"
            })
        }
        const user = await User.findOne({ resetPasswordOtp: otp, resetPasswordOtpExpiry: { $gt: Date.now() } }).select("+password")

        if (!user) {
            return res.status(500).json({
                success: false,
                message: "invalid or expired otp"
            })
        }

        user.password = newPassword
        user.resetPasswordOtp = null
        user.resetPasswordOtpExpiry = null

        await user.save()

        res.status(200).json({
            success: true,
            message: `password changed`
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const addTask = async (req, res) => {
    try {

        const { title, description } = req.body
        const user = await User.findById(req.user._id)
        user.task.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now())
        })
        await user.save()

        res.status(200).json({
            success: true,
            messsage: "Task added successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const removeTask = async (req, res) => {
    try {

        const { taskId } = req.params
        const user = await User.findById(req.user._id);
        user.task = user.task.filter((t) => t._id.toString() !== taskId.toString())

        await user.save()

        res.status(200).json({
            success: true,
            messsage: "Task deleted successfully"
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const updateTask = async (req, res) => {
    try {

        const { taskId } = req.params
        const user = await User.findById(req.user._id);
      const selectedTask =  user.task.find((t) => t._id.toString() === taskId.toString())
        console.log(selectedTask)

        selectedTask.completed = !selectedTask.completed
       

        await user.save()

        res.status(200).json({
            success: true,
            messsage: "Task updated successfully"
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

