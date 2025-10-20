import {v2 as cloudinary} from "cloudinary"
import { ENV } from "./env.js"

cloudinary.config({
    cloud_name:ENV.CLOUDINARY_CLOUD_NAME,
    api_key:ENV.CLOUDINARY_API_KEY,
    api_secret:ENV.CLOUDINARY_API_SECRET
});

export default cloudinary;

// import {v2 as cloudinary} from "cloudinary"
// You are importing version 2 of the Cloudinary SDK and giving it the alias cloudinary.

// This allows you to use all the methods like cloudinary.uploader.upload() for uploading images, cloudinary.api.delete_resources() for deleting, etc.