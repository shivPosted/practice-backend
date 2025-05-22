import mongoose, { Schema } from "mongoose"; // mongoose.Schema = Schema;
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true, //NOTE: make it easier to search but don't overuse it for performance
      unique: true,
    },
    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"], //NOTE: data validation
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

//NOTE: pre hook is used to run a function just before an event in this case the save event

userSchema.pre("save", async function (next) {
  if (!this.isModified("password"))
    //NOTE: check if the user has modified password or not
    return next();

  this.password = await bcrypt.hash(this.password, 10);
  console.log("applying password encryption");
  next();
});

//NOTE: methods property allow you to create your own custom methods for a schema
userSchema.methods.isPasswordCorrect = async function (password) {
  //using async because it will take some time for bcrypt to run algo and check password

  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  //NOTE: accept payload , token private key, and options like expiresIn, etc.
  return jwt.sign(
    {
      _id: this._id, //NOTE: it is given by mongodb for each document
      userName: this.userName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id, //NOTE: it is given by mongodb for each document
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", userSchema);
