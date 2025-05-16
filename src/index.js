import "dotenv/config";
import express from "express";

import dbConnect from "./db/mongodb.js";
import asyncHandler from "./utils/asyncHandler.js";
const app = express();

// NOTE:IFFE for connecting directly in index
// ;(
// async () => {
//   try {
//     const dbInstance = await mongoose.connect(
//       `${process.env.MONGODB_URI}/${MONGOODB_NAME}`,
//     );
//     console.log("\n databse connected");
//     console.log(dbInstance.connections);
//     app.on("error", (error) => console.log("Error: ", error)); //called on error event
//   } catch (err) {
//     console.error(err.message);
//     process.exit(1); //exit the process with failure code
//   }
// }
// )();

const port = process.env.PORT || 8000;

dbConnect()
  .then(() => {
    app.listen(port, () => console.log(`App is listening on port: ${port}`));
  })
  .catch((err) => console.error(err));

app.get(
  "/",
  asyncHandler(async (req, res) => {
    if (4 % 2 === 0) {
      res.send("All good");
      return "All good";
    } else throw new Error("Some problem occured");
  }),
);
