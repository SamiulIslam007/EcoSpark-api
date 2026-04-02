import { Router } from "express";
import { UploadController } from "./upload.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";

const router = Router();

router.post("/image", protect, upload.single("file"), UploadController.uploadImage);

export default router;
