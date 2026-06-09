import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

function uploadBuffer(buffer, originalname, folder = "tour-travel") {
  return new Promise((resolve, reject) => {
    const ext = originalname.split(".").pop().toLowerCase();
    const public_id = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id,
        resource_type: "image",
        format: ext === "jpeg" ? "jpg" : ext,
        transformation: [{ width: 1200, quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export { uploadBuffer, ALLOWED_TYPES, MAX_SIZE };
