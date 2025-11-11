import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit"; // For PDF generation
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ MONGODB CONNECTION ------------------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
	console.error("❌ MONGO_URI is not set. Please configure environment variables.");
	process.exit(1);
}
const ADMIN_KEY = process.env.ADMIN_KEY || "VBSAdmin#8372";

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------ PAYMENT MODEL ------------------
const paymentSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		phone: { type: String, required: true },
		amount: { type: Number, required: true },
		status: { type: String, default: "Paid" },
		reference: { type: String },
		ticketType: { type: String, default: "Regular" },
		ticketId: { type: String, unique: true, required: true },
		eventDate: { type: String, default: "Dec 15, 2025" },
		eventTime: { type: String, default: "09:00 AM" },
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

async function generateTicketId() {
	while (true) {
		const random = crypto.randomBytes(3).toString("hex").toUpperCase();
		const candidate = `VBS-${random}`;
		// eslint-disable-next-line no-await-in-loop
		const exists = await Payment.findOne({ ticketId: candidate });
		if (!exists) {
			return candidate;
		}
	}
}

const Payment = mongoose.model("Payment", paymentSchema);

// ------------------ HUBTEL CONFIG ------------------
const HUBTEL_BASE_URL = "https://api.hubtel.com/v1/merchantaccount/merchants";
const HUBTEL_MERCHANT_ID = process.env.HUBTEL_API_ID || "";
const HUBTEL_API_KEY = process.env.HUBTEL_API_KEY || "";

// ------------------ SIMPLE ADMIN AUTH MIDDLEWARE ------------------
function requireAdmin(req, res, next) {
	const key = req.headers["x-admin-key"];
	if (!ADMIN_KEY || key !== ADMIN_KEY) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	next();
}

// ------------------ VERIFY PAYMENT ENDPOINT ------------------
app.post("/api/verify-payment", async (req, res) => {
	const { reference, name, phone, amount } = req.body;

	if (!reference) return res.status(400).json({ error: "Payment reference is required" });

    try {
		// Manual path for non-Hubtel or testing
		if (reference === "manual_payment") {
			if (!name || !phone || typeof amount !== "number") {
				return res.status(400).json({ error: "name, phone and amount are required for manual_payment" });
			}
			if (amount < 300) {
				return res.status(400).json({ success: false, message: "Payment not valid or below required amount" });
			}
			const existing = await Payment.findOne({ phone });
			if (existing) {
				return res.status(400).json({ message: "This number already has a ticket." });
			}
			const ticketId = await generateTicketId();
			const newPayment = new Payment({
				name,
				phone,
				amount,
				status: "Paid",
				reference,
				ticketType: req.body.ticketType || "Regular",
				ticketId,
			});
			await newPayment.save();
			return res.json({ success: true, message: "Ticket issued successfully", data: newPayment });
		}

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

			const ticketId = await generateTicketId();
            const newPayment = new Payment({
                name: paymentData.customer.name,
                phone: paymentData.customer.phoneNumber,
                amount: paymentData.amount,
                status: "Paid",
                reference: reference,
				ticketType: req.body.ticketType || "Regular",
				ticketId,
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

// ------------------ ADMIN MANAGEMENT ENDPOINTS ------------------
// Create manual payment/ticket
app.post("/api/admin/create", requireAdmin, async (req, res) => {
	try {
		const { name, phone, amount, status, ticketType } = req.body;
		if (!name || !phone || typeof amount !== "number") {
			return res.status(400).json({ error: "name, phone, amount are required" });
		}
		const exists = await Payment.findOne({ phone });
		if (exists) {
			return res.status(409).json({ error: "This number already has a ticket." });
		}
		const ticketTypeValue = ticketType || "Regular";
		const ticketId = await generateTicketId();
		const newPayment = new Payment({
			name,
			phone,
			amount,
			status: status || "Paid",
			reference: `admin_${ticketTypeValue}`,
			ticketType: ticketTypeValue,
			ticketId,
		});
		await newPayment.save();
		return res.json({ success: true, message: "Ticket created successfully!", data: newPayment });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: "Failed to create ticket" });
	}
});

// List all
app.get("/api/admin/payments", requireAdmin, async (req, res) => {
	try {
		const payments = await Payment.find().sort({ createdAt: -1 });
		res.json({ count: payments.length, data: payments });
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch payments" });
	}
});

// Update
app.put("/api/admin/payments/:id", requireAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const update = req.body || {};
		const doc = await Payment.findByIdAndUpdate(id, update, { new: true });
		if (!doc) return res.status(404).json({ error: "Not found" });
		return res.json({ success: true, data: doc });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: "Failed to update" });
	}
});

// Delete
app.delete("/api/admin/payments/:id", requireAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const doc = await Payment.findByIdAndDelete(id);
		if (!doc) return res.status(404).json({ error: "Not found" });
		return res.json({ success: true });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: "Failed to delete" });
	}
});

// ------------------ PUBLIC TICKET ENDPOINTS ------------------
app.get("/api/tickets/:ticketId", async (req, res) => {
	try {
		const ticket = await Payment.findOne({ ticketId: req.params.ticketId });
		if (!ticket) {
			return res.status(404).json({ error: "Ticket not found" });
		}
		return res.json({
			data: {
				id: ticket._id,
				name: ticket.name,
				phone: ticket.phone,
				amount: ticket.amount,
				status: ticket.status,
				reference: ticket.reference,
				ticketType: ticket.ticketType,
				ticketId: ticket.ticketId,
				eventDate: ticket.eventDate,
				eventTime: ticket.eventTime,
				createdAt: ticket.createdAt,
			},
		});
	} catch (e) {
		console.error(e);
		return res.status(500).json({ error: "Failed to fetch ticket" });
	}
});

app.get("/api/tickets/:ticketId/verify", async (req, res) => {
	try {
		const ticket = await Payment.findOne({ ticketId: req.params.ticketId });
		if (!ticket) {
			return res.status(404).json({ valid: false, message: "Ticket not found" });
		}
		return res.json({
			valid: true,
			ticketId: ticket.ticketId,
			name: ticket.name,
			phone: ticket.phone,
			status: ticket.status,
			ticketType: ticket.ticketType,
			eventDate: ticket.eventDate,
			eventTime: ticket.eventTime,
		});
	} catch (e) {
		console.error(e);
		return res.status(500).json({ valid: false, message: "Failed to verify ticket" });
	}
});

// ------------------ ADMIN ENDPOINT ------------------
// Note: moved to protected route above

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

// Serve frontend static files (only for non-API routes)
const staticMiddleware = express.static(path.join(__dirname2, "frontend/dist"));
app.use((req, res, next) => {
	if (req.path.startsWith("/api/") || req.path.startsWith("/ticket-pdf/")) {
		return next(); // Skip static serving for API routes
	}
	staticMiddleware(req, res, next);
});

// Catch-all route to serve index.html for frontend routing (GET only, non-API)
app.get("*", (req, res) => {
	if (req.path.startsWith("/api/")) {
		return res.status(404).json({ error: "API route not found" });
	}
	res.sendFile(path.join(__dirname2, "frontend/dist/index.html"));
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
