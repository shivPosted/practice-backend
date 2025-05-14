import "dotenv/config";
import dbConnect from "./db/mongodb.js";

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

dbConnect();
