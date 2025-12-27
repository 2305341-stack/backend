import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"



const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
            unique: true
        },
        coverImage: {
            type: String // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }


    },
    {
        timestamps: true
    }

)


// humara data save horha ho uss se pehle mujhe password encrypt krwana hai
// jab v hum arrow wala function use krte h for callback purpose usme this ka reference nahi hota hai, context nhi pata hota hai,aur pre keliye humko this ka reference chahiye hota hai
//kyunki humko user details aur password wagera chahiye hoga iss func m 
// isiliye iss trh se call back likhrhe h ...() => {} aise nahi
// async kyunki ye encryption wagera time leti h 
//middleware
UserSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
})

UserSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function(){
   return jwt.sign(
    {
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
UserSchema.methods.generateRefreshToken = function(){
       return jwt.sign(
    {
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}


export const User = mongoose.model("User", UserSchema)