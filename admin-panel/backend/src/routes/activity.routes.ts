import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getActivityLogs } from "../controllers/activity.controller";

const router = Router();

router.get("/", requireAuth, getActivityLogs);

export { router as activityRouter };

