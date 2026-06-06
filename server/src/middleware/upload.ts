import multer from "multer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (
      ALLOWED_MIME_TYPES.includes(
        file.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      callback(null, true);
      return;
    }

    callback(new Error("Only JPEG, PNG, and WEBP images are allowed"));
  },
});

export const uploadSingle = upload.single("image");
