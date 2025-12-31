import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js" // here we are importing the User from the user schema to check if the user already exists or not
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"; // to return the response


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


export {registerUser}