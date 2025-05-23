import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const userRouter = Router();

//NOTE:
// userRouter: This is an instance of an Express router, created using express.Router(). It helps organize routes related to users (in this case).
// .route("/register"): This sets up routing for the "/register" path. It's a cleaner way of defining multiple HTTP methods (like GET, POST, etc.) for a single route.
// .post(registerUser): This defines what happens when a POST request is made to the /register path. Specifically, it tells Express to call the registerUser function when such a request is received.

userRouter.route("/register").post(
  //NOTE: we can also use middleware before calling registerUser for handling files before using upload(imported from multer)
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

//NOTE: using verify jwt to get id out of token for using in loginUser req
//use middleware before executing main function, next is used to tell the router to go to next function or middleware
userRouter.route("/login").post(verifyJWT, loginUser);

export default userRouter;
