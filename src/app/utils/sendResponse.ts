import { Response } from "express";
import { ISendResponse } from "../interfaces/common.interface.js";

export const sendResponse = <T>(res: Response, data: ISendResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
  });
};
