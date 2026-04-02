import { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";

const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ success: false, message: "No image file provided" });
    return;
  }
  const url = await uploadToCloudinary(file.buffer);
  res.json({ url });
});

export const UploadController = { uploadImage };
