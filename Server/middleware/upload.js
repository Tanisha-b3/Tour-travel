import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, extname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED.has(ext)) {
    return cb(new Error(`Only ${[...ALLOWED].join(", ")} images are allowed`));
  }
  if (file.mimetype && !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter,
});

export default upload;