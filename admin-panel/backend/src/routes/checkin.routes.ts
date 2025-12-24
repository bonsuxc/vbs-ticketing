import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { checkInTicket } from "../controllers/checkin.controller";

const router = Router();

router.post("/", requireAuth, checkInTicket);

export { router as checkinRouter };

