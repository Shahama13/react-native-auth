import express from "express"
import { register, verify, login, logout, addTask, updateTask, forgotPassword, removeTask, getMyProfile, updateProfile, updatePassword, resetPassword } from "../controllers/user.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router()

router.get("/", (req, res) => {
    res.send("Working");
});

router.route("/register").post(register)
router.route("/verify").post(isAuthenticated, verify)
router.route("/login").post(login)
router.route("/logout").get(logout)
router.route("/me").get(isAuthenticated, getMyProfile)

router.route("/newtask").post(isAuthenticated, addTask)
router.route("/task/:taskId").get(isAuthenticated, updateTask)
    .delete(isAuthenticated, removeTask)

router.route("/update-profile").post(isAuthenticated, updateProfile)
router.route("/update-password").put(isAuthenticated, updatePassword)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password").put(resetPassword)

export default router;