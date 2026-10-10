import multer from "multer";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype) || file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF and image files are allowed"));
  },
});

export function uploadSingle(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    next();
  });
}
