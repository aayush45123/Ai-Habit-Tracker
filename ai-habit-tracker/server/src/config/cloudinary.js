import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "1234567890",
  api_secret: process.env.CLOUDINARY_API_SECRET || "secret",
  secure: true,
});

/**
 * Upload buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Destination folder name
 * @returns {Promise<string>} Uploaded image URL
 */
export const uploadToCloudinary = (buffer, folder = "avatars") => {
  return new Promise((resolve, reject) => {
    // If Cloudinary environment variables are missing, fallback to data URI or mock image URL
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "demo") {
      const mimeType = "image/png";
      const base64Str = buffer.toString("base64");
      const mockDataUri = `data:${mimeType};base64,${base64Str.slice(0, 100)}...`;
      console.warn("⚠️ CLOUDINARY_CLOUD_NAME not set in .env. Returning local image placeholder URL.");
      return resolve(`https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ai-habit-tracker/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

export default cloudinary;
