import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError}  from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    //get user data from request body
    //validation//
    //check if already exist
    //check for images,check for avatar
    //upload them to cloudinary , avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //return response with user data

    const { username, email, fullName, password } = req.body;
    console.log(`email: ${email}`);

    //check if any field is empty
    if(
        [fullName, username, email, password].some((field) => field?.trim() === "") 
    ){
        throw new ApiError(400, "Full detail is required is required");
    }

    //check if user already exists
    const existedUser = User.findOne({
        $or: [{ username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists with this username or email");
    }
    

    const avatarLocationPath =req.files?.avatar[0]?.path;
    const coverImageLocationPath = req.files?.coverImage[0]?.path;

    if(!avatarLocationPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocationPath)
    const coverImage = await uploadOnCloudinary(coverImageLocationPath)

    if(!avatar) {
        throw new ApiError(500, "Failed to upload avatar to cloudinary");
    }

    //entry to db
    const User = await User.create({
        fullName,
        avatar: avatar.url,
        convertImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(username._id).select(" -password -refreshToken");

    if(!createdUser) {
        throw new ApiError(500, "something  went while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
})

export { registerUser }