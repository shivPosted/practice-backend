import "dotenv/config";

import dbConnect from "./db/mongodb.js";

import app from "./app.js";

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
