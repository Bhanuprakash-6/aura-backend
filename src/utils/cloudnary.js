import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

 // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Click 'View API Keys' above to copy your cloud name
        api_key: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API key
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    
const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) {
            return null;
        }
        //uploading the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto" // Automatically detect the resource type (image, video, etc.)
        })
        //console.log("File uploaded successfully to Cloudinary",response.url);
        fs.unlinkSync(localFilePath); // Delete the local file after upload
        //console.log("Local file deleted after upload");
        return response;

    }catch(error){
        fs.unlinkSync(localFilePath); // Delete the local file if upload fails
        //console.error("Error uploading file to Cloudinary:", error);
        return null;
    }
}

export { uploadOnCloudinary };