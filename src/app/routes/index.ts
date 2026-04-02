import { Router } from "express";
import adminRoutes from "../module/admin/admin.route.js";
import categoryRoutes from "../module/category/category.route.js";
import commentRoutes from "../module/comment/comment.route.js";
import ideaRoutes from "../module/idea/idea.route.js";
import paymentRoutes from "../module/payment/payment.route.js";
import uploadRoutes from "../module/upload/upload.route.js";
import voteRoutes from "../module/vote/vote.route.js";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/upload", uploadRoutes);
router.use("/ideas", ideaRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export const IndexRoutes = router;
