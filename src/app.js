import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import asyncHandler from "./utils/asyncHandler";

const app = express();

//NOTE: app.use() is mainly used for using middlewares or doing configuration
//NOTE: cors() is used to check whether the origin have access to talk to our server
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

//NOTE: express.json() is used to tell the server to handle the files if recieved in json format
//✅ express.json() — What It Does and Why We Use It
// In an Express.js application, express.json() is a built-in middleware function that parses incoming JSON payloads in HTTP request bodies.
// 🔍 Why We Use express.json()
// When a client (like a browser, Postman, or frontend app) sends a POST, PUT, or PATCH request with a Content-Type of application/json, the body of that request is raw JSON text.
// express.json() parses that text into a JavaScript object so you can access it via req.body.

app.use(
  express.json({
    limit: "16kb",
  }),
);

// ✅ express.urlencoded() — What It Does and Why We Use It
// In Express.js, express.urlencoded() is a built-in middleware function that parses incoming URL-encoded data — typically from HTML form submissions — and makes it available on req.body.

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);

// 🔍 Why We Use express.static()
// By default, Express doesn’t serve static files. So if you want users to access files like stylesheets or images from your project, you need to use express.static().

app.use(express.static("public"));

// 🔍 Why We Use cookieParser()
// To easily read cookies sent by the browser in requests (req.cookies)
//
// To access signed cookies securely (req.signedCookies)
//
// Useful for sessions, auth tokens, preferences, etc.

app.use(cookieParser());
