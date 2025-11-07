import express from 'express';
import { getTicket, createManualTicket } from '../controllers/ticketController.js';

const router = express.Router();

router.post('/ticket', getTicket);
router.post('/manual-ticket', createManualTicket);

export default router;

