import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, extname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(ext)) cb(null, true);
  else cb(new Error(`Only ${ALLOWED.join(", ")} images are allowed`), false);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

export default upload;
