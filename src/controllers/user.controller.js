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

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); //finding user by the provided user id

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;

    //NOTE: explicitly saving the document to database because it is not auto synced even if refrenced
    user.save({
      validateBeforeSave: false, //NOTE: for avoiding validation related error if saving partial fields
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError("Could not generate access and refresh tokens", 500);
  }
};

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

  const { fullName, email, userName, password } = req.body; //NOTE: we can not access files from req.body directly

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
  const avatarLocalPath = req.files?.avatar[0].path;

  const coverImageLocalPath = req.files?.coverImage?.[0].path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar File is Required");

  //NOTE: uploading to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  let coverImage;
  if (coverImageLocalPath)
    coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError("Avatar File is Required", 400);

  const newUser = await User.create([
    {
      fullName,
      userName: userName.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password,
      email,
    },
  ]);

  const newCreatedUser = await User.findById(newUser?.[0]?._id).select(
    "-password -refreshToken",
  ); //NOTE:  '-' denote not to include these fieles

  if (!newCreatedUser)
    throw new ApiError("Could not register the user, try again", 500);

  return res
    .status(201)
    .json(new ApiResponse(200, "User successfully registered", newCreatedUser));
});

const loginUser = asyncHandler(async (req, res) => {
  //TODO:
  //take input from user
  //check either email or userName is given
  //check if user exist
  //if exist:
  //check password
  //if correct password generate access and refresh token
  //save refresh token to db
  //send tokens to client browser(in cookies)

  const { email = "", userName = "", password } = req.body;

  if (!userName && !email)
    throw new ApiError("Please provide email or username", 400);

  // BUG: if you exclude password from the fields and try to apply isPasswordCorrect method on user  on that instance this.password of method is undefined so hashing will fail👇👇
  // const user = await User.findOne({
  //   $or: [{ userName }, { email }],
  // }).select("-password -refreshToken");

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  }).select("-refreshToken");

  console.log(user);
  if (!user) throw new ApiError("User does not exist", 404);

  const passwordAuthenticated = await user.isPasswordCorrect(password); //NOTE: user. not User. because the method is available on document or field in mongodb not a mehtod of mongoose like findById, etc.

  if (!passwordAuthenticated)
    throw new ApiError("Invalid login credentials", 400);

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const updatedUserAfterTokenGeneration = await User.findById(user._id).select(
    "-password -refreshToken", //includes fields without password and refreshToken
  );

  const cookieOptions = {
    //cookies options that are common
    httpOnly: true,
    secure: true,
  };

  //NOTE: sending response and cookie data to the user
  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions) //used to set cookies in client's browser
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Logged in Successfully", {
        user: updatedUserAfterTokenGeneration,
        accessToken,
        refreshToken,
      }),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    //NOTE: update query
    $set: {
      refreshToken: null,
    },
  });

  const cookieOptions = {
    //cookies options that are common
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, "User Successfully Logged Out", {}));
});

export { registerUser, loginUser, logoutUser };
