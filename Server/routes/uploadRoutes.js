import { Router } from "express";
import auth, { adminOnly } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { uploadBuffer } from "../services/uploadService.js";

const router = Router();

router.post("/image", auth, adminOnly, (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Image must be under 5 MB" : err.message || "Upload failed";
      return res.status(400).json({ error: msg });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    try {
      const url = await uploadBuffer(req.file.buffer, req.file.originalname);
      res.status(201).json({ url });
    } catch (e) {
      console.error("[upload] cloudinary error:", e.message);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
});

router.post("/images", auth, adminOnly, (req, res) => {
  upload.array("images", 10)(req, res, async (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE" ? "Each image must be under 5 MB" : err.message || "Upload failed";
      return res.status(400).json({ error: msg });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }
    try {
      const urls = await Promise.all(
        req.files.map((f) => uploadBuffer(f.buffer, f.originalname))
      );
      res.status(201).json({ urls });
    } catch (e) {
      console.error("[upload] cloudinary error:", e.message);
      res.status(500).json({ error: "Failed to upload images" });
    }
  });
});

export default router;
