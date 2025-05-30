import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

    user.refreshToken = bcrypt.hashSync(refreshToken, 10); //hashing refreshToken before saving it

    //NOTE: explicitly saving the document to database because it is not auto synced even if refrenced
    await user.save({
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
      avatar: {
        url: avatar.secure_url,
        publicId: avatar.public_id,
      },
      coverImage: {
        url: coverImage?.secure_url || "",
        publicId: coverImage?.public_id || null,
      },
      password,
      email,
    },
  ]);

  const newCreatedUser = await User.findById(newUser?.[0]?._id).select(
    "-password -refreshToken",
  ); //NOTE:  '-' denote not to include these fieles

  if (!newCreatedUser)
    throw new ApiError("Could not register the user, try again", 500);

  return res.status(201).json(
    new ApiResponse(200, "User successfully registered", {
      ...newCreatedUser,
      avatar: avatar.secure_url,
      coverImage: coverImage?.secure_url,
    }),
  );
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
        user: {
          ...updatedUserAfterTokenGeneration,
          avatar: updatedUserAfterTokenGeneration.avatar.url,
          coverImage: updatedUserAfterTokenGeneration.coverImage?.url || "",
        },
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  //NOTE: refreshing access token in case of expiration
  const recievedRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!recievedRefreshToken)
    throw new ApiError(
      "Your web token seems to be expired please login again",
      401,
    );

  try {
    const decodedToken = jwt.verify(
      recievedRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!decodedToken) throw new ApiError("Unauthorized access", 404);

    const user = await User.findById(decodedToken._id);

    if (!user) throw new ApiError("Token expired or invalid user", 404);

    const doesTokenMatch = bcrypt.compare(
      recievedRefreshToken,
      user.refreshToken,
    );

    if (!doesTokenMatch) throw new ApiError("Invalid Token request", 400);

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
      user._id,
    ); //generating and saving to the database

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accesToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(201, "Token successfully refreshed", {
          accessToken,
          refreshToken,
        }),
      );
  } catch (error) {
    throw new ApiError(error.message || "Can not refresh token", 400);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (confirmPassword !== newPassword)
    throw new ApiError("Enter password correctly", 400);

  const user = await User.findById(req.user._id);

  if (!user)
    throw new ApiError(
      "You are not authorized to change password, user does not exist",
      404,
    );

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) throw new ApiError("Wrong password entered");

  user.password = newPassword;

  await user.save({
    validateBeforeSave: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password Successfully Changed", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError("Invalid request, no user found", 404);

  const user = req.user.toObject(); //NOTE:toObject is a mongoose related method and not native js

  return res.status(200).json(
    new ApiResponse(200, "User found Successfully", {
      ...user,
      avatar: req.user.avatar.url,
      coverImage: req.user.coverImage.url || "",
    }),
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  if (!req.user)
    throw new ApiError("Unauthorized request , user not found", 404);
  const { email = "", userName = "", fullName = "" } = req.body;

  if (!(email || userName || fullName))
    throw new ApiError("Provide email, username, fullname to change", 400);
  const updatedFields = {};

  if (email) updatedFields.email = email;
  if (userName) updatedFields.userName = userName;
  if (fullName) updatedFields.fullName = fullName;

  const fetchedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updatedFields,
    },
    { new: true },
  ).select("-password");

  if (!fetchedUser) throw new ApiError("No user found with this id", 404);

  return res
    .status(200)
    .json(new ApiResponse(200, "Account details udpated", {}));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError("Not Authorized", 400);

  if (!req.file) throw new ApiError("No avatar file found", 400);

  const localPath = req.file?.path;

  if (!localPath)
    throw new ApiError("Could not store file on local system", 500);

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken",
  );

  if (!user) throw new ApiError("Invalid access no user found", 404);

  const avatar = await uploadOnCloudinary(localPath);

  const newAvatar = {
    url: avatar.secure_url,
    publicId: avatar.public_id,
  };

  await deleteFromCloudinary(user.avatar?.publicId); //deleting previous image(avatar) from cloudinary

  user.avatar = newAvatar;

  await user.save({
    validateBeforeSave: false,
  });

  return res.status(200).json(
    new ApiResponse(200, "Avatar successully updated", {
      avatar: newAvatar.url,
    }),
  );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  console.log("inside updating cover image");
  if (!req.user) throw new ApiError("Not Authorized", 400);

  if (!req.file) throw new ApiError("No cover image found", 400);

  const localPath = req.file?.path;

  if (!localPath)
    throw new ApiError("Could not store file on local system", 500);

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken",
  );

  if (!user) throw new ApiError("Invalid access no user found", 404);

  const cover = await uploadOnCloudinary(localPath);

  const newCover = {
    url: cover.secure_url,
    publicId: cover.public_id,
  };

  await deleteFromCloudinary(user.coverImage?.publicId); //deleting previous image(avatar) from cloudinary

  user.coverImage = newCover;

  await user.save({
    validateBeforeSave: false,
  });

  return res.status(200).json(
    new ApiResponse(200, "Avatar successully updated", {
      coverImage: newCover.url,
    }),
  );
});

const getChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName) throw new ApiError("No user found", 400);

  const profile = User.aggregate([
    //NOTE: mongoose doesn't interfare with aggregate it will be directly handled by mogoDB
    //returns an array
    {
      $match: {
        userName: userName?.toLowerCase(), //will give the document that will match to userName recieved fro url
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers", //will resul in array
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo", //will resul in array
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscibers",
        },
        subsribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $condn: {
            $if: {
              $in: [req.user?._id, "$subscribers subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  if (!profile) throw new ApiError("Can not found user info", 500);

  return res.status(200).json(
    new ApiResponse(200, "User profile successully fetched", {
      ...profile?.[0],
    }),
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateAccountDetails,
  getCurrentUser,
  changeCurrentPassword,
  updateUserAvatar,
  updateCoverImage,
  getChannelProfile,
};
