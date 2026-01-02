// User is for themethods given by mongoose and user is for the methods that are created by us
// thats why see in some places there is User and others there is user
//keep this in mind

// also whenever database is being called always use await

import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js" // here we are importing the User from the user schema to check if the user already exists or not
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"; // to return the response
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken //This line simply stores the refresh token inside the user document.
        await user.save({validateBeforeSave: false}) //aves the updated user object back into MongoDB

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")
    }
}


const registerUser = asyncHandler( async (req, res) => {
        // get user details from frontend
        // validation - not empty, we can also check more like format and all
        // check if user already exists - ex check from username or email
        // we are taking two files from user - avatar and coverImage
        // check for images , check for avatar(as this is a required field)
        // upload them to cloudinary
        //check avatar once again on cloudinary
        // create user object - create entry in db
        // remove password and refreshtoken field from response
        // check for user creation
        // return response or else send error

        //getting user details from frontend .body is used jab data form se ya json se aarha h, url se arha uska alag hota h

       const {fullName, email, username, password} = req.body
       // console.log("email: ", email);



        // as a beginner this is how you check, if statements for each field one by one
       //if (fullName === "") {
        //    throw new ApiError(400, "fullname is required")
       //} but mow how can you do it in a better way?
       if (
            [fullName, email, username, password].some((field) => {
                    field?.trim() === ""
            })
        ) {
            throw new ApiError(400, "All fields are required") // now we can also check fro validation like if there is an @ symbol there in the email or not using if statement, the one that we have used is a more advanced way of checking
            }


    const existedUser = await User.findOne({
        $or: [{ email }, { username }] // using the $ we can use various operators. here we are using or to check if either of email or username exists, we can pass as many fiedls as we want to check in it
    })

    if (existedUser) {
        throw new ApiError(409, "username or email already exists")
    }
    // console.log(req.files); // sb aise hi print krke dekho
    // jaise req.body by default express ne dediya h waise hi req.files ka access multer ne diya h
    // ab hoskta h files ka access ho ya na ho toh optionally chain krna behtar h isliye ? use kiya h 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // incase of optional chaining like ? here in both, for avatar we have checked in the next step
    // as coverimage is not required so we havent checked for it but in this case if the user doesnt upload the
    // the cover image then it will give error because coverimage will get undefined even if it is optional 
    // so we have to add a code if we are not checking for something , we can use if else for checkiong if that value came or not

    //   const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //so now we are writing like this
    // also what we could do was we could also say that directory null krdo agar cover image ni h toh wo v ek tareeka h
    let coverImageLocalPath; //remember scope issues
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    //cover image hai toh v theek ni h toh v theek toh usko checvk ni kr rhe usme humne required true v ni kiya ths
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }
    // after all conditions are checked and everything is done, now we will entry it to the database "User" using User.create

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        // now as coverimage is not compulsory we havent checked for it so we will use ? because it means if coverimage is there then return url else not
        // here we cant directly use coberimage.url as we dont know if it is present or not
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })
        // removing password and refresh token
     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )

     if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
     }

     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
     )

 })

 //LOGIN

 const loginUser = asyncHandler( async (req, res) => {
        // reqbody se data le aao
        // username based access or email based access
        // find the user 
        // if found password check
        // if correct generate access and refresh token
        // send cookie to the user (for these tokens), we will learn about secure cookies

        const {email, username, password} = req.body
        if (!username && !email) {
            throw new ApiError(400, "username or email is required")
        }
        //here is an alternative
        // if(!(username|| email))

        const user = await User.findOne({
            $or: [{username}, {email}]
        })

        if (!user) {
            throw new ApiError(404, "user does not exist")
        }

       const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials")
        }

        // now we have to geenrate access and refresh tokens . this is so common that we will have to do it for a multiple no of times
        // so we can put it in a separate method and then use it directly here
       const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

       const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        //sending to cookies
        const options = {
            httpOnly: true, //by default cookies can be modified by anyone in frontend, but httpOnly and secure true se cookies can only be modified by server
            secure: true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in Successfully"
            )
        )


 })

 //LOGOUT

 const logoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options =  {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged out "))

 })

//we have to make an endpoint for refresh access token
//uss se pehle controller banana padega

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
   }

  try {
    const decodedToken =  jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
  
     const user = await User.findById(decodedToken?._id)
     if (!user) {
      throw new ApiError(401, "invalid refresh token")
     }
  
  if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used")
  }
  
  const options = {
      httpOnly: true,
      secure: true
  }
  const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newRefreshToken, options)
  .json(
      new ApiResponse(
          200,
          {accessToken, refreshToken: newRefreshToken},
          "Access token refreshed successfully"
      )
  )
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
  }
  // now we will make an endpoint for refresh token in routes
})
// ab hum banarhe kuch kuch functions user keliye
// agar password change kr parha h iska mtlb user logged in h
// agar loggedin h, kyunki humne auth middleware lagaya h and middleware k req.user m humne user ki information le rkhi h
// toh agar auth middleware chala h toh user humein wahan se milega
// user se related har cheez m pehla question yahi h ki user kahan se milega upar v jitna banaye yahan v
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id) // ? indicates ki agar req.user hoga whaan pe toh id nikal lo
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) //await krwarhe kyunki ye ek async method h
    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }
//else
user.password = newPassword
await user.save({validateBeforeSave: false})

return res
.status(200)
.json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true} //shows the updated details
    ).select("-password") 

 return res
 .status(200)
 .json(new ApiResponse(200, "Account details updated successfully"))
})

// controller for updating files, advice: always write separate controllers for updating files
// file update krne keliye multer middleware use krna hoga kyunki uss se file update krwayi h
// also authenticate wala v krna hoga kyunki agar user logged in nahi hai toh update kaise krega



// assignment : delete the old image write a utility func for it

const updateUserAvatar = asyncHandler(async (req, res) => {
    // req.files multer middleware se milrha
    // ab wahan pe multiple files kr rhe the islie req.files liye the
    // yahan pe sirf ek file ki baat h toh req.file lena hoga

const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
         {
            // set se ye horha h ki sirf avatar ko update kr rhe pura har cheez ko nhi
            $set:{
                avatar: avatar.url
            }
         },
        {new: true}
    ).select("-password")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "avatar image updated successfully")
    )
})

//for cover image same 
const updateUserCoverImage = asyncHandler(async (req, res) => {
    // req.files multer middleware se milrha
    // ab wahan pe multiple files kr rhe the islie req.files liye the
    // yahan pe sirf ek file ki baat h toh req.file lena hoga

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPathLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
         {
            // set se ye horha h ki sirf avatar ko update kr rhe pura har cheez ko nhi
            $set:{
                coverImage: coverImage.url
            }
         },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "cover image updated successfully")
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}