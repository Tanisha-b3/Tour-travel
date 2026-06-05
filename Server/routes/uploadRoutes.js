import { Router } from "express";
import auth, { adminOnly } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

router.post("/image", auth, adminOnly, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Image must be under 5 MB" : err.message || "Upload failed";
      return res.status(400).json({ error: msg });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

router.post("/images", auth, adminOnly, (req, res) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Each image must be under 5 MB" : err.message || "Upload failed";
      return res.status(400).json({ error: msg });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    res.status(201).json({ urls });
  });
});

export default router;
