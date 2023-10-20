export const sendToken =async (res, user, statusCode, message) => {
    const userData = {
        _id:user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        tasks: user.task,
        verified: user.verified,
    }
    const token =  user.getJWTToken()
    res.status(statusCode).cookie("token", token , {
        httpOnly:true,
        expires:new Date(Date.now()+process.env.COOKIE_EXPIRE*24*60*60*1000)
    }).json({
        success: true,
        message: message,
        user: userData,
    })
}