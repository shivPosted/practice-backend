import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async function (localFilePath) {
  if (!localFilePath) return null;

  try {
    //NOTE: uploading file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file uploaded to cloudinary
    if (!res.url) throw new Error("Can not upload file to cloudinary");
    //remove the temporary saved  file 👇
    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    console.error(error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async function (publicId) {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res;
  } catch (error) {
    throw new Error(error.message);
  }
};
export { uploadOnCloudinary, deleteFromCloudinary };
