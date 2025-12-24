import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", requireAuth, getDashboardStats);

export { router as dashboardRouter };

