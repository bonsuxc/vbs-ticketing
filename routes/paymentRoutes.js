// routes/paymentRoutes.js
import express from 'express';
import { verifyAndCreateTicket } from '../controllers/paymentController.js';

const router = express.Router();

// body: { transactionId, phoneNumber? }
router.post('/verify', verifyAndCreateTicket);

export default router;
