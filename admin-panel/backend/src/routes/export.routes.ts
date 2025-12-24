import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { exportPaymentsCSV } from "../controllers/export.controller";

const router = Router();

router.get("/payments/csv", requireAuth, exportPaymentsCSV);

export { router as exportRouter };

