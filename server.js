import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import PDFDocument from "pdfkit"; // For PDF generation
import QRCode from "qrcode";
import multer from "multer";
import ExcelJS from "exceljs";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer();

// ------------------ DATABASE (PostgreSQL via Prisma) ------------------
const prisma = new PrismaClient();
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Please configure environment variables.");
    process.exit(1);
}

function generateAccessCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit ambiguous
    let code = "";
    for (let i = 0; i < 5; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
const ADMIN_KEY = process.env.ADMIN_KEY || "VBSAdmin#8372";

// ------------------ HELPERS ------------------
async function generateTicketId() {
    while (true) {
        const random = crypto.randomBytes(3).toString("hex").toUpperCase();
        const candidate = `VBS-${random}`;
        // eslint-disable-next-line no-await-in-loop
        const exists = await prisma.payment.findUnique({ where: { ticketId: candidate } });

// ------------------ ADMIN VERIFY ENDPOINTS ------------------
app.post("/api/admin/verify", requireAdmin, async (req, res) => {
    try {
        const { ticketId } = req.body || {};
        if (!ticketId) return res.status(400).json({ ok: false, message: "ticketId is required" });
        const ticket = await prisma.payment.findUnique({ where: { ticketId } });
        if (!ticket) return res.status(404).json({ ok: false, status: "invalid", message: "Ticket not found" });
        if (ticket.used) return res.status(409).json({ ok: false, status: "used", message: "Already used" });
        const adminHeader = req.headers["x-admin-key"] ? String(req.headers["x-admin-key"]) : "admin";
        const updated = await prisma.payment.update({ where: { ticketId }, data: { used: true, verifiedAt: new Date(), verifiedBy: adminHeader } });
        return res.json({ ok: true, status: "verified", ticketId: updated.ticketId, verifiedAt: updated.verifiedAt });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ ok: false, message: "Verification failed" });
    }
});

app.get("/api/admin/verify/logs", requireAdmin, async (req, res) => {
    try {
        const logs = await prisma.payment.findMany({
            where: { used: true },
            orderBy: { verifiedAt: "desc" },
            select: { ticketId: true, name: true, phone: true, verifiedAt: true, verifiedBy: true },
            take: 100,
        });
        return res.json({ data: logs });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to fetch logs" });
    }
});
        if (!exists) {
            return candidate;
        }
    }
}

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
            const existing = await prisma.payment.findFirst({ where: { phone } });
            if (existing) {
                return res.status(400).json({ message: "This number already has a ticket." });
            }
            const ticketId = await generateTicketId();
            const created = await prisma.payment.create({
                data: {
                    name,
                    phone,
                    amount,
                    status: "Paid",
                    reference,
                    ticketType: req.body.ticketType || "Regular",
                    ticketId,
                    accessCode: generateAccessCode(),
                },
            });
            return res.json({ success: true, message: "Ticket issued successfully", data: { ...created, _id: String(created.id) } });
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
            const existingPayment = await prisma.payment.findFirst({ where: { phone: paymentData.customer.phoneNumber } });

            if (existingPayment) {
                return res.status(400).json({ message: "This number already has a ticket." });
            }

            const ticketId = await generateTicketId();
            const created = await prisma.payment.create({
                data: {
                    name: paymentData.customer.name,
                    phone: paymentData.customer.phoneNumber,
                    amount: paymentData.amount,
                    status: "Paid",
                    reference: reference,
                    ticketType: req.body.ticketType || "Regular",
                    ticketId,
                    accessCode: generateAccessCode(),
                },
            });
            return res.json({ success: true, message: "Ticket issued successfully", data: { ...created, _id: String(created.id) } });
        } else {
            return res.status(400).json({ success: false, message: "Payment not valid or below required amount" });
        }
    } catch (error) {
        console.error("Payment verification error:", error.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

// ------------------ ADMIN MANAGEMENT ENDPOINTS ------------------
// Export manual ticket template with 100 pre-generated secure codes
app.get("/api/admin/manual-template", requireAdmin, async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("ManualTickets");
        sheet.columns = [
            { header: "Name", key: "name", width: 24 },
            { header: "Phone Number", key: "phone", width: 18 },
            { header: "Ticket Type", key: "ticketType", width: 12 },
            { header: "Payment Status", key: "status", width: 14 },
            { header: "Secure Code", key: "accessCode", width: 14 },
        ];

        const codes = new Set();
        while (codes.size < 100) {
            codes.add(generateAccessCode());
        }
        Array.from(codes).forEach((code) => {
            sheet.addRow({ name: "", phone: "", ticketType: "Regular", status: "Paid", accessCode: code });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=manual-ticket-template.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) {
        console.error(e);
        return res.status(500).send("Failed to generate template");
    }
});

// Import manual tickets using provided secure codes (no auto-generation here)
app.post("/api/admin/manual-import", requireAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) return res.status(400).json({ error: "Empty workbook" });

        // Map headers
        const headerRow = sheet.getRow(1);
        const headers = {};
        headerRow.eachCell((cell, colNumber) => {
            headers[String(cell.value).toLowerCase()] = colNumber;
        });
        const get = (row, headerName) => row.getCell(headers[headerName] || 0).value || "";

        const results = [];
        for (let i = 2; i <= sheet.rowCount; i += 1) {
            const row = sheet.getRow(i);
            const name = String(get(row, "name")).trim();
            const phone = String(get(row, "phone number")).trim() || String(get(row, "phone")).trim();
            const ticketType = String(get(row, "ticket type")).trim() || "Regular";
            const status = String(get(row, "payment status")).trim() || "Paid";
            const providedCode = String(get(row, "secure code")).trim();

            if (!name && !phone && !providedCode) continue; // skip empty rows

            try {
                if (!name || !phone) throw new Error("Name and Phone are required");
                if (!providedCode) throw new Error("Secure Code is required");
                const accessCode = providedCode.toUpperCase();
                if (accessCode.length !== 5) throw new Error("Secure Code must be 5 characters");

                const existingByPhone = await prisma.payment.findFirst({ where: { phone } });
                if (existingByPhone) throw new Error("Phone already has a ticket");
                const existingByCode = await prisma.payment.findFirst({ where: { accessCode } });
                if (existingByCode) throw new Error("Secure Code already used");

                const ticketId = await generateTicketId();
                const amount = ticketType === "VIP" ? 500 : 300;
                const doc = await prisma.payment.create({
                    data: {
                        name,
                        phone,
                        amount,
                        status: status || "Paid",
                        reference: "bulk_import",
                        ticketType,
                        ticketId,
                        accessCode,
                    },
                });
                results.push({ row: i, success: true, ticketId: doc.ticketId });
            } catch (err) {
                results.push({ row: i, success: false, error: err.message });
            }
        }

        return res.json({ results });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to import" });
    }
});

// Create manual payment/ticket
app.post("/api/admin/create", requireAdmin, async (req, res) => {
    try {
        const { name, phone, amount, status, ticketType } = req.body;
        if (!name || !phone || typeof amount !== "number") {
            return res.status(400).json({ error: "name, phone, amount are required" });
        }
        const exists = await prisma.payment.findFirst({ where: { phone } });
        if (exists) {
            return res.status(409).json({ error: "This number already has a ticket." });
        }
        const ticketTypeValue = ticketType || "Regular";
        const ticketId = await generateTicketId();
        const created = await prisma.payment.create({
            data: {
                name,
                phone,
                amount,
                status: status || "Paid",
                reference: `admin_${ticketTypeValue}`,
                ticketType: ticketTypeValue,
                ticketId,
                accessCode: generateAccessCode(),
            },
        });
        return res.json({ success: true, message: "Ticket created successfully!", data: { ...created, _id: String(created.id) } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to create ticket" });
    }
});

// List all
app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({ orderBy: { createdAt: "desc" } });
        const mapped = payments.map((p) => ({ ...p, _id: String(p.id) }));
        res.json({ count: mapped.length, data: mapped });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

// Update
app.put("/api/admin/payments/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body || {};
        const intId = Number(id);
        const doc = await prisma.payment.update({ where: { id: intId }, data: update });
        if (!doc) return res.status(404).json({ error: "Not found" });
        return res.json({ success: true, data: { ...doc, _id: String(doc.id) } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to update" });
    }
});

// Delete
app.delete("/api/admin/payments/:id", requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const intId = Number(id);
        await prisma.payment.delete({ where: { id: intId } });
        return res.json({ success: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to delete" });
    }
});

// ------------------ PUBLIC TICKET ENDPOINTS ------------------
app.get("/api/tickets/:ticketId", async (req, res) => {
    try {
        const ticket = await prisma.payment.findUnique({ where: { ticketId: req.params.ticketId } });
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        return res.json({
            data: {
                id: ticket.id,
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
        const ticket = await prisma.payment.findUnique({ where: { ticketId: req.params.ticketId } });
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

// Manual lookup by phone number + access code (no amount threshold)
app.post("/api/tickets/lookup", async (req, res) => {
    try {
        const { phone, accessCode } = req.body || {};
        if (!phone || !accessCode) return res.status(400).json({ error: "Phone and access code are required" });
        const ticket = await prisma.payment.findFirst({ where: { phone, accessCode: String(accessCode).toUpperCase() } });
        if (!ticket) {
            return res.status(404).json({ error: "Invalid phone number or access code" });
        }

        return res.json({
            data: {
                id: ticket.id,
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
        return res.status(500).json({ error: "Failed to lookup ticket" });
    }
});

// ------------------ TICKET PDF ENDPOINT ------------------
app.get("/ticket-pdf/:id", async (req, res) => {
    try {
        const idParam = req.params.id;
        let ticket = null;
        const numericId = Number(idParam);
        if (!Number.isNaN(numericId)) {
            ticket = await prisma.payment.findUnique({ where: { id: numericId } });
        }
        if (!ticket) {
            // fallback by ticketId
            ticket = await prisma.payment.findUnique({ where: { ticketId: idParam } });
        }

        if (!ticket) return res.status(404).send("Ticket not found");

        // Slim ticket format (~receipt/cinema style)
        const doc = new PDFDocument({ size: [595, 220], margin: 16 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=ticket-${ticket.ticketId || ticket.id}.pdf`);

        doc.pipe(res);


        // Dimensions
        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const margin = 16;
        const stubW = Math.floor(pageW * 0.32);
        const leftW = pageW - stubW - margin; // leave some breathing space on the right
        const leftX = margin;
        const leftY = margin;
        const leftH = pageH - margin * 2;
        const stubX = leftX + leftW;
        const stubY = margin;
        const stubH = leftH;

        // Backgrounds
        // Left: hero image backdrop
        const assetsDir = path.join(__dirname2, "frontend", "dist", "assets");
        let heroPath = null;
        try {
            const files = fs.readdirSync(assetsDir);
            const heroFile = files.find((f) => /^hero-.*\.(png|jpg|jpeg)$/i.test(f));
            if (heroFile) heroPath = path.join(assetsDir, heroFile);
        } catch {}
        doc.save();
        doc.rect(leftX, leftY, leftW, leftH).clip();
        if (heroPath && fs.existsSync(heroPath)) {
            doc.image(heroPath, leftX, leftY, { width: leftW, height: leftH, align: "center", valign: "center" });
        } else {
            doc.rect(leftX, leftY, leftW, leftH).fill("#0b1220");
        }
        // overlay for readability
        doc.rect(leftX, leftY, leftW, leftH).fillOpacity(0.45).fill("#000").fillOpacity(1);
        doc.restore();

        // Right stub background (rounded)
        doc.save();
        doc.fill("#0f172a");
        if (typeof doc.roundedRect === "function") {
            doc.roundedRect(stubX, stubY, stubW, stubH, 10).fill();
        } else {
            doc.rect(stubX, stubY, stubW, stubH).fill();
        }
        doc.restore();

        // Perforation line between panels
        doc.save();
        doc.strokeColor("#94a3b8").dash(4, { space: 3 });
        doc.moveTo(stubX, stubY + 10).lineTo(stubX, stubY + stubH - 10).stroke();
        doc.undash();
        doc.restore();

        // Header on left panel
        const eventTitle = "VBS 2025: Limitless";
        const eventDate = "December 27, 2025";
        const eventTime = ticket.eventTime || "09:00 AM";
        const accent = "#60a5fa"; // modern blue
        const subtle = "#cbd5e1"; // slate-300
        const white = "#ffffff";

        doc.fillColor(white).font("Helvetica-Bold").fontSize(28)
            .text(eventTitle, leftX + 18, leftY + 14, { width: leftW - 36, align: "left" });
        doc.font("Helvetica").fontSize(12).fillColor(subtle)
            .text(`Date: ${eventDate} · ${eventTime}`, leftX + 18, leftY + 50, { width: leftW - 36 })
            .text(`Venue: International Community School Pakyi No. 2`, { width: leftW - 36 })
            .fillColor(white)
            .text(`Type: ${ticket.ticketType || "Regular"}`, { width: leftW - 36 });

        // Ticket info on left panel (single-line values, no overlapping)
        const infoY = leftY + 96; // push down below header lines
        let y = infoY;
        const lineGap = 18;
        doc.font("Helvetica-Bold").fontSize(14).fillColor(white).text(`Name: ${ticket.name}`, leftX + 18, y, { width: leftW - 36 });
        y += lineGap;
        doc.fontSize(14).text(`Phone: ${ticket.phone}`, leftX + 18, y, { width: leftW - 36 });
        y += lineGap;
        doc.fontSize(14).text(`Ticket ID: ${ticket.ticketId}`, leftX + 18, y, { width: leftW - 36 });
        y += lineGap;
        doc.fontSize(14).fillColor(accent).text(`Secure Code: ${ticket.accessCode || "—"}`, leftX + 18, y, { width: leftW - 36 });
        y += lineGap;
        doc.fillColor(white).fontSize(14).text(`Amount: GHS ${Number(ticket.amount).toFixed(2)}`, leftX + 18, y, { width: leftW - 36 });

        // QR on stub
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const verifyUrl = `${baseUrl}/api/tickets/${encodeURIComponent(ticket.ticketId)}/verify`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 5 });
        const qrSize = Math.min(110, stubW - 40);
        const qrX = (stubW - qrSize) / 2;
        const qrY = stubY + 26;
        doc.image(qrDataUrl, stubX + qrX, qrY, { width: qrSize, height: qrSize });
        doc.font("Helvetica").fontSize(10).fillColor(subtle).text("Scan to verify", stubX, qrY + qrSize + 6, { width: stubW, align: "center" });

        // Admit One + secure code on stub
        doc.font("Helvetica-Bold").fontSize(12).fillColor(white).text("ADMIT ONE", stubX, stubY + 18, { width: stubW, align: "center" });
        doc.font("Helvetica-Bold").fontSize(12).fillColor(accent).text(`Code: ${ticket.accessCode || "—"}`, stubX, qrY + qrSize + 20, { width: stubW, align: "center" });

        // Branding on stub bottom
        const assetsDirLogo = path.join(__dirname2, "frontend", "dist", "assets");
        let logoPath = null;
        try {
            const files = fs.readdirSync(assetsDirLogo);
            const logoFile = files.find((f) => /(oxtech|logo).*\.(png|jpg|jpeg|webp|svg)$/i.test(f));
            if (logoFile) logoPath = path.join(assetsDirLogo, logoFile);
        } catch {}
        const brandY = stubY + stubH - 22;
        if (logoPath && fs.existsSync(logoPath)) {
            doc.save();
            doc.opacity(0.9);
            const imgW = Math.min(60, stubW - 20);
            const imgX = stubX + stubW - imgW - 10;
            doc.image(logoPath, imgX, brandY - 14, { width: imgW });
            doc.restore();
        }
        doc.font("Helvetica").fontSize(10).fillColor(subtle).text("Powered by OxTech", stubX + 10, brandY, { width: stubW - 20, align: "left" });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ------------------ HEALTH ------------------
app.get("/api/health", async (req, res) => {
    try {
        // Simple connectivity check
        await prisma.$queryRaw`SELECT 1`;
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
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
