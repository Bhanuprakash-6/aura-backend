import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError}  from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken(); 
    
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false});

    return { accessToken, refreshToken} ;
}


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
    const existedUser = await User.findOne({
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

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.
    // coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    
    if(!avatar) {
        throw new ApiError(500, "Failed to upload avatar to cloudinary");
    }

    

    //entry to db
    const newUser = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(" -password -refreshToken");

    if(!createdUser) {
        throw new ApiError(500, "something  went while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
})


const loginUser = asyncHandler(async(req,res) => {
    const {username,email,password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "Username and email are required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not exist with this username or email");
    }

    const isPasswordValid = await user.isPasswordCorrect(password); 
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    //sending tokens in cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .status(200)
        .json(
            new ApiResponse(
                200, 
                {
                 user: loggedInUser,
                 accessToken,refreshToken
                },
                "User logged in successfully"
            )
        );
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", "", options)
        .cookie("refreshToken", "", options)
        .json(new ApiResponse(200, null, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized token is required");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user) {
            throw new ApiError(401, "Unauthorized token user");
        } 
        
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Unauthorized token , token expired or invalid");
        }
    
        const option = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", refreshToken, option)
            .json(
                new ApiResponse(200, {
                    accessToken,
                    newrefreshToken
                }, "Access token refreshed successfully")
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid or expired refresh token");
        
    }
    
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(
        new ApiResponse(200, null, "Password changed successfully")
    );

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    );
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if(!fullName || !email) {
        throw new ApiError(400, "Full name and email are required");        

    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {
            new: true,
            
        }
        
    ).select("-password ");

    return res.status(200).json(
        new ApiResponse(200, user, "User details updated successfully")
    );

})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url) {
        throw new ApiError(400, "Failed to upload avatar");
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password ");

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const coverImage  = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url) {
        throw new ApiError(400, "Failed to upload coverImage");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password ");

    return res.status(200).json(
        new ApiResponse(200, user, "Cover image updated successfully")
    );
})




export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage
}