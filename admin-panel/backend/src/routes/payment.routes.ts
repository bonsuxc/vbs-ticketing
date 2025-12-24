import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getPayments, deletePayment } from "../controllers/payment.controller";

const router = Router();

router.get("/", requireAuth, getPayments);
router.delete("/:id", requireAuth, deletePayment);

export { router as paymentRouter };

