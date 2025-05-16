import mongoose from "mongoose";
import { MONGOODB_NAME } from "../constants.js";
import express from "express";

const app = express();

async function dbConnect() {
  try {
    mongoose.connection.on("connected", () =>
      console.log("connection successful"),
    );
    const dbInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${MONGOODB_NAME}`,
    );
  } catch (err) {
    console.error("Connection to database failed: ", err);
    process.exit(1);
  }
}

export default dbConnect;
