import mongoose from "mongoose";
import { MONGOODB_NAME } from "../constants.js";
import express from "express";

const app = express();

async function dbConnect() {
  try {
    const dbInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${MONGOODB_NAME}`,
    );
    console.log("\n databse connected");
  } catch (err) {
    console.error("Connection to database failed: ", err);
    process.exit(1);
  }
}

export default dbConnect;
