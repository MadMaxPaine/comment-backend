const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const ApiError = require("../errors/errors.API");

const uploadImgDir = path.join(__dirname, "..", "uploads/comments/img");
const uploadTXTDir = path.join(__dirname, "..", "uploads/comments/txt");

[uploadImgDir, uploadTXTDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory created: ${dir}`);
  }
});

const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
const allowedTextTypes = ["text/plain"];

const fileFilter = (req, file, cb) => {
  console.log("File type:", file.mimetype);

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedTextTypes.includes(file.mimetype)
  ) {
    return cb(null, true);
  }

  console.error("Unsupported file type:", file.mimetype);
  return cb(ApiError.badRequest("Supported file formats: image/jpeg, image/png, image/gif, text/plain"), false);
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    cb(null, isImage ? uploadImgDir : uploadTXTDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext || ext === ".") {
      if (file.mimetype === "image/png") ext = ".png";
      else if (file.mimetype === "image/gif") ext = ".gif";
      else if (file.mimetype === "image/jpeg") ext = ".jpg";
      else if (file.mimetype === "text/plain") ext = ".txt";
      else ext = ".bin"; // fallback
    }
    const fileName = uniqueSuffix + ext;
    console.log("Filename", fileName);

    cb(null, fileName);
  },
});

const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const checkFileSize = (req, res, next) => {
  if (!req.file) return next();

  if (req.file.mimetype === "text/plain" && req.file.size > 100 * 1024) {
    return next(
      ApiError.badRequest("Text-file size should be less than 100 KB.")
    );
  }

  if (
    req.file.mimetype.startsWith("image/") &&
    req.file.size > 5 * 1024 * 1024
  ) {
    return next(ApiError.badRequest("Img size should be less than 5 MB."));
  }

  next();
};

const resizeImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith("image/")) return next();

  const filePath = req.file.path;
  const newFileName = `resized-${req.file.filename}`;
  const newFilePath = path.join(uploadImgDir, newFileName);

  try {
    const metadata = await sharp(filePath).metadata();

    if (metadata.width > 320 || metadata.height > 240) {
      await sharp(filePath)
        .resize(320, 240, { fit: "inside" })
        .toFile(newFilePath);
      await fs.promises.unlink(filePath); // асинхронне видалення
      req.file.filename = newFileName;
      req.file.path = newFilePath;
    }

    next();
  } catch (err) {
    console.error("Error while resizing image:", err);
    next(ApiError.internal("Error while changing image size."));
  }
};

module.exports = { upload, checkFileSize, resizeImage };
