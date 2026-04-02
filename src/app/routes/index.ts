import { Router } from "express";
import adminRoutes from "../modules/admin/admin.routes";
import categoryRoutes from "../modules/category/category.routes";
import commentRoutes from "../modules/comment/comment.routes";
import ideaRoutes from "../modules/idea/idea.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import voteRoutes from "../modules/vote/vote.routes";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/ideas", ideaRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export const IndexRoutes = router;
