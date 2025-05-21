import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); //NOTE: using this instead of ../../public/temp because the path is considered from the index file from where the app is being run , ./ refers to current dir where app is running i.e. the index.js file folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

export const upload = multer({ storage });
