import asyncHandler from "../utils/asyncHandler.js";

//NOTE:
// //(req, res): These are the request and response objects provided by Express.
// req (short for "request"): contains data about the HTTP request (e.g., headers, body, query params).
// res (short for "response"): used to send back a response to the client.
// res.status(200): Sets the HTTP response status code to 200, which means "OK" (i.e., success).
// .json({ message: "ok" }): Sends a JSON response to the client with the object { message: "ok" }.

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export default registerUser;
