import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AdminService } from "./admin.service.js";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query as Record<string, string>);
  res.json(result);
});

const toggleUserActive = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.toggleUserActive(req.params["id"] as string, req.user!.id);

  if ("notFound" in result) { res.status(404).json({ message: "User not found" }); return; }
  if ("selfAction" in result) { res.status(400).json({ message: "Cannot deactivate your own account" }); return; }

  res.json(result);
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.changeUserRole(
    req.params["id"] as string,
    req.body.role,
    req.user!.id
  );

  if ("invalid" in result) { res.status(400).json({ message: "Role must be MEMBER or ADMIN" }); return; }
  if ("selfAction" in result) { res.status(400).json({ message: "Cannot change your own role" }); return; }

  res.json(result);
});

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await AdminService.getDashboardStats();
  res.json(stats);
});

const adminDeleteIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.adminDeleteIdea(req.params["id"] as string);
  if ("notFound" in result) { res.status(404).json({ message: "Idea not found" }); return; }
  res.json({ message: "Idea deleted by admin" });
});

const subscribeNewsletter = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ message: "Email is required" }); return; }
  await AdminService.subscribeNewsletter(email);
  res.json({ message: "Subscribed successfully" });
});

export const AdminController = {
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  getDashboardStats,
  adminDeleteIdea,
  subscribeNewsletter,
};
