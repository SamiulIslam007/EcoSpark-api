import { Router } from "express";
import adminRoutes from "../modules/admin/admin.routes.js";
import categoryRoutes from "../modules/category/category.routes.js";
import commentRoutes from "../modules/comment/comment.routes.js";
import ideaRoutes from "../modules/idea/idea.routes.js";
import paymentRoutes from "../modules/payment/payment.routes.js";
import voteRoutes from "../modules/vote/vote.routes.js";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/ideas", ideaRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export const IndexRoutes = router;
