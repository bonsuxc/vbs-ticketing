import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit"; // For PDF generation
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ MONGODB CONNECTION ------------------
const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://gbteenschapel_db_user:p53dW4nPkn5dQ2kV@vbs25-ticketing.f86cxfn.mongodb.net/?retryWrites=true&w=majority";

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------ PAYMENT MODEL ------------------
const paymentSchema = new mongoose.Schema({
    name: String,
    phone: String,
    amount: Number,
    status: String,
    reference: String,
    createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", paymentSchema);

// ------------------ HUBTEL CONFIG ------------------
const HUBTEL_BASE_URL = "https://api.hubtel.com/v1/merchantaccount/merchants";
const HUBTEL_MERCHANT_ID = "y6zDx8w"; // API ID
const HUBTEL_API_KEY = "d833f58510f74ce2ac26c998e2c61d24"; // API Key

// ------------------ VERIFY PAYMENT ENDPOINT ------------------
app.post("/api/verify-payment", async (req, res) => {
    const { reference } = req.body;

    if (!reference) return res.status(400).json({ error: "Payment reference is required" });

    try {
        const response = await axios.get(
            `https://api.hubtel.com/v1/merchantaccount/onlinecheckout/${reference}`,
            {
                auth: {
                    username: HUBTEL_MERCHANT_ID,
                    password: HUBTEL_API_KEY,
                },
            }
        );

        const paymentData = response.data;
        if (paymentData.status === "Success" && paymentData.amount >= 300) {
            const existingPayment = await Payment.findOne({ phone: paymentData.customer.phoneNumber });

            if (existingPayment) {
                return res.status(400).json({ message: "This number already has a ticket." });
            }

            const newPayment = new Payment({
                name: paymentData.customer.name,
                phone: paymentData.customer.phoneNumber,
                amount: paymentData.amount,
                status: "Paid",
                reference: reference,
            });

            await newPayment.save();
            return res.json({ success: true, message: "Ticket issued successfully", data: newPayment });
        } else {
            return res.status(400).json({ success: false, message: "Payment not valid or below required amount" });
        }
    } catch (error) {
        console.error("Payment verification error:", error.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

// ------------------ ADMIN ENDPOINT ------------------
app.get("/api/admin/payments", async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.json({ count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

// ------------------ TICKET PDF ENDPOINT ------------------
app.get("/ticket-pdf/:id", async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Payment.findById(ticketId);

        if (!ticket) return res.status(404).send("Ticket not found");

        const doc = new PDFDocument({ size: "A5", margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=ticket-${ticket.id}.pdf`);

        doc.pipe(res);

        // Background
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f2f2f2");

        // Header
        doc.fillColor("#0077ff").fontSize(22).text("VBS 2025", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor("black")
            .text(`Date: Dec 15, 2025`, { align: "center" })
            .text(`Seat: General Admission`, { align: "center" });

        doc.moveDown(1);

        // Attendee info box
        doc.rect(50, 150, 400, 120).fill("#ffffff").stroke();
        doc.fillColor("black").fontSize(16)
            .text(`Ticket ID: ${ticket.id}`, 60, 160)
            .text(`Name: ${ticket.name}`, 60, 190)
            .text(`Phone: ${ticket.phone}`, 60, 220);

        // Footer: Powered by OxTech
        doc.fontSize(10).fillColor("gray").text("Powered by OxTech", { align: "center", baseline: "bottom" });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ------------------ SERVE FRONTEND ------------------
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

// Serve frontend static files
app.use(express.static(path.join(__dirname2, "frontend/dist")));

// Catch-all route to serve index.html for frontend routing
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname2, "frontend/dist/index.html"));
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
