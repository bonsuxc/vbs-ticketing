import Ticket from '../models/Ticket.js';
import QRCode from 'qrcode';

export const getTicket = async (req, res) => {
    const { phoneNumber } = req.body;
    const ticket = await Ticket.findOne({ phoneNumber });

    if (!ticket) return res.status(404).json({ message: 'No ticket found for this number.' });
    if (ticket.amount < 300) {
        return res.status(400).json({ message: 'Payment below ₵300. Please pay ₵300 or more to access your ticket.' });
    }

    const qrData = `Ticket ID: ${ticket.ticketId}\nPhone: ${ticket.phoneNumber}\nAmount: ₵${ticket.amount}`;
    const qrImage = await QRCode.toDataURL(qrData);
    res.json({ message: 'Ticket retrieved successfully', qrImage });
};

export const createManualTicket = async (req, res) => {
    const { phoneNumber, amount } = req.body;
    if (!phoneNumber || !amount) return res.status(400).json({ message: 'Phone and amount required' });

    const ticketId = 'VBS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const isValid = amount >= 300;

    const ticket = new Ticket({ phoneNumber, amount, ticketId, paymentStatus: 'manual', isValid });
    await ticket.save();

    res.json({
        message: 'Manual ticket created successfully',
        status: isValid ? 'valid' : 'invalid',
        ticketId,
    });
};

