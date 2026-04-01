import { Response } from "express";

type SendResponseOptions<T> = {
  res: Response;
  statusCode?: number;
  success?: boolean;
  message: string;
  data?: T;
};

export const sendResponse = <T>({
  res,
  statusCode = 200,
  success = true,
  message,
  data,
}: SendResponseOptions<T>) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};
