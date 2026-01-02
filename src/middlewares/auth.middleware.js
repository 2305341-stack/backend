// verifies user hai ya nahi
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => { //kabhi kabhi aisa hoskta hai ki req use horha h next use horha h but res use ni horha jaise ki iss case m toh res hatake underscore lagado, achi practice h
try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
       if(!user){
        throw new ApiError(401, "Invalid Access Token")
       }
    
       req.user = user;
       next()
} catch (error) {
    throw new ApiError(401, error?.message || "invalid access token")
}
   
 
})