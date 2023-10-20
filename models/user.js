import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be atleast 8 characters long"],
        select: false

    },
    verified: {
        type: Boolean,
        default: false
    },
    avatar: {
        public_id: String,
        url: String,
    },
    task: [
        {
            title: String,
            description: String,
            completed: Boolean,
            createdAt: Date
        }
    ],
    otp: Number,
    otp_expiry: Date,
    resetPasswordOtp:Number,
    resetPasswordOtpExpiry:Date
}, {
    timestamps: true
})

userSchema.methods.getJWTToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    })
}

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password)
}

userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 })

export const User = mongoose.model("User", userSchema)