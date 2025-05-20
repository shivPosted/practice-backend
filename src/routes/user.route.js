import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

//NOTE:
// userRouter: This is an instance of an Express router, created using express.Router(). It helps organize routes related to users (in this case).
// .route("/register"): This sets up routing for the "/register" path. It's a cleaner way of defining multiple HTTP methods (like GET, POST, etc.) for a single route.
// .post(registerUser): This defines what happens when a POST request is made to the /register path. Specifically, it tells Express to call the registerUser function when such a request is received.

userRouter.route("/register").post(
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
); //NOTE: we can also use middleware before calling the registerUser by using {} before referencing main controller

export default userRouter;
