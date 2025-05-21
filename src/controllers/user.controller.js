import { upload } from "../middlewares/multer.middleware.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

//NOTE:
// //(req, res): These are the request and response objects provided by Express.
// req (short for "request"): contains data about the HTTP request (e.g., headers, body, query params).
// res (short for "response"): used to send back a response to the client.
// res.status(200): Sets the HTTP response status code to 200, which means "OK" (i.e., success).
// .json({ message: "ok" }): Sends a JSON response to the client with the object { message: "ok" }.

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, userName, password } = req.body(); //NOTE: we can not access files from req.body directly

  //checking if any field is empty
  if (
    [fullName, email, userName, password].some(
      (item) => item.trim() === "" || item.trim() === null,
    )
  )
    throw new ApiError("All fields are necessary", 400);

  //NOTE: for checking if one of the mentioned fields already exist
  const userExists = await User.findOne({
    $or: [{ userName }, { email }], //you can study about $or
  });

  if (userExists) throw new ApiError("User already exists", 409);

  //NOTE: getting files from req object as there is middleware of multer used multer.fields before executing the registerUser function to upload files to server temporarily
  //
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(req.files);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar File is Required");

  //NOTE: uploading to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError("Avatar File is Required", 400);

  const newUser = await User.create([
    {
      fullName,
      userName: userName.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage.url,
      password,
      email,
    },
  ]);

  const newCreatedUser = await User.findById(newUser?._id).select(
    "-password -refreshToken",
  ); //NOTE:  '-' denote not to include these fieles

  if (!newCreatedUser)
    throw new ApiError("Could not register the user, try again", 500);

  return res
    .status(201)
    .json(new ApiResponse(200, "User successfully registered", newCreatedUser));
});

export default registerUser;
