// controllers/paymentController.js
import axios from 'axios';
import Ticket from '../models/Ticket.js'; // your Mongoose model
import QRCode from 'qrcode';

const HUBTEL_ID = process.env.HUBTEL_API_ID;
const HUBTEL_KEY = process.env.HUBTEL_API_KEY;

// helper: basic auth header for Hubtel
function hubtelAuthHeader() {
    const token = Buffer.from(`${HUBTEL_ID}:${HUBTEL_KEY}`).toString('base64');
    return { Authorization: `Basic ${token}` };
}

// Verify a single transaction by TransactionID via Hubtel API
export async function verifyTransaction(transactionId) {
    // NOTE: endpoint varies by Hubtel docs / account region. This example uses a common pattern.
    // If your merchant docs give a different path, replace this URL accordingly.
    const url = `https://api.hubtel.com/v1/merchant/transactions/${transactionId}`;
    const res = await axios.get(url, { headers: hubtelAuthHeader(), timeout: 10000 });
    return res.data; // hubtel response (inspect in logs)
}

// Endpoint: POST /api/payment/verify
// body: { transactionId, phoneNumber? }
// If transaction successful and Amount >= 300 -> generate ticket
export async function verifyAndCreateTicket(req, res) {
    try {
        const { transactionId, phoneNumber } = req.body;
        if (!transactionId) return res.status(400).json({ message: 'transactionId is required' });

        // 1) Check if we've already created a ticket for this transaction
        const existing = await Ticket.findOne({ transactionId });
        if (existing) {
            return res.status(409).json({ message: 'Ticket already created for this transaction', ticketId: existing.ticketId });
        }

        // 2) Call Hubtel to verify transaction
        let hubRes;
        try {
            hubRes = await verifyTransaction(transactionId);
        } catch (err) {
            console.error('Hubtel verify error', err.response?.data || err.message);
            return res.status(502).json({ message: 'Failed to verify with Hubtel', detail: err.response?.data || err.message });
        }

        // 3) Check payload (structure differs slightly per Hubtel API version; log and inspect)
        // Expect something like: { Status: 'Success', Amount: 300, CustomerMsisdn: '024xxxxx', ... }
        const status = hubRes?.Status || hubRes?.status || hubRes?.Data?.status;
        const amount = hubRes?.Amount || hubRes?.amount || hubRes?.Data?.amount;
        const customerMsisdn = hubRes?.CustomerMsisdn || hubRes?.customer || hubRes?.Data?.customer;

        // Safety: if fields are nested differently, return the full hubRes so you can inspect
        if (!status) {
            console.warn('Unexpected Hubtel response shape', hubRes);
            return res.status(502).json({ message: 'Unexpected Hubtel response shape', hubRes });
        }

        if (String(status).toLowerCase() !== 'success') {
            return res.status(400).json({ message: 'Transaction not successful', status });
        }

        if (!amount || Number(amount) < 300) {
            return res.status(400).json({ message: 'Payment amount is less than GHS 300', amount });
        }

        // Prefer phoneNumber passed from client, fallback to Hubtel's customer msisdn
        const phone = phoneNumber || customerMsisdn;
        if (!phone) {
            return res.status(400).json({ message: 'Customer phone not available. Provide phoneNumber or ensure Hubtel returns CustomerMsisdn.' });
        }

        // 4) Prevent multiple tickets per phone for same or previous successful transaction if desired:
        const byPhone = await Ticket.findOne({ phoneNumber: phone, amount: { $gte: 300 } });
        if (byPhone) {
            // optional: allow another ticket if transactionId differs; here we disallow
            return res.status(409).json({ message: 'This phone number already has a valid ticket', ticketId: byPhone.ticketId });
        }

        // 5) Create ticket record
        const ticketId = `VBS${Date.now().toString().slice(-8)}`; // short unique id
        const ticketUrl = `${process.env.BASE_URL || ''}/ticket/${ticketId}`;
        const qrCode = await QRCode.toDataURL(ticketUrl);

        const ticket = new Ticket({
            phoneNumber: phone,
            amount,
            transactionId,
            ticketId,
            qrCode,
            paymentStatus: 'paid',
            isValid: true,
        });

        await ticket.save();

        // 6) Return ticket info (you can later send SMS or return download link)
        return res.json({
            message: 'Ticket created',
            ticketId,
            ticketUrl,
            qrCode,
        });
    } catch (err) {
        console.error('verifyAndCreateTicket error', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
}
