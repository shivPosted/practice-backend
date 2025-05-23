import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    //in case when there is no cookies we can also use header() to get accessToken like below
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.split(" ")?.[1] ||
      null;
    if (!token)
      throw new ApiError(
        "You are not Authorized token verification failed",
        404,
      );

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id);

    if (!user) throw new ApiError("Invalid access token", 401);

    req.user = user;

    next(); //NOTE: have to use next() because verifyJWT is a custom middleware that we will use in routes
  } catch (error) {
    throw new ApiError(error.message || "Could not verify your token", 404);
  }
});

export default verifyJWT;
