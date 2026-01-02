import { Router } from "express";
import
 { 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verify } from "jsonwebtoken";


const router = Router()

router.route("/register").post(
    // injecting middleware just before a method
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
// iss wale verify jwt nahi lagarhe kyunki already wo sb hum refreshaccesstoken ke controller m kar chuke h ussi func m sb verify kr chuke

router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
// yahan pe post rkhne se sari details update hojayengi isiliye remember to use patch


//ek aur cheez verifyJWT wahin use horhi h jahan jahan humko ye chahiye ki user logged in hona chhaiye,so basically authentication jaisa

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar) //upload multer ka hum use kr rhe functionality
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)


export default router