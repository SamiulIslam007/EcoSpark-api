import multer from "multer";

/**
 * Multer middleware that stores uploaded files in memory.
 * Files are then passed to Cloudinary via the uploadToCloudinary util.
 *
 * Usage in a route:
 *   router.post('/ideas', protect, upload.array('images', 5), IdeaController.createIdea);
 */
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5,                   // max 5 images per upload
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});
