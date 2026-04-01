import { Router } from "express";
import adminRoutes from "./admin.routes";
import categoryRoutes from "./category.routes";
import commentRoutes from "./comment.routes";
import ideaRoutes from "./idea.routes";
import paymentRoutes from "./payment.routes";
import voteRoutes from "./vote.routes";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/ideas", ideaRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export const IndexRoutes = router;
