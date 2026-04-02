import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import categoryRoutes from "./category.routes.js";
import commentRoutes from "./comment.routes.js";
import ideaRoutes from "./idea.routes.js";
import paymentRoutes from "./payment.routes.js";
import voteRoutes from "./vote.routes.js";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/ideas", ideaRoutes);
router.use("/votes", voteRoutes);
router.use("/comments", commentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export const IndexRoutes = router;
