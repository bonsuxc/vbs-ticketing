// src/routes/ticketPDF.js or wherever your routes are
import express from "express";
import PDFDocument from "pdfkit";

const router = express.Router();

// Example: mock function to get ticket data by ID
const getTicketById = async (id) => {
    // Replace this with your database logic
    return {
        id,
        name: "John Doe",
        email: "john@example.com",
        event: "VBS 2025",
        date: "December 27, 2025",
        seat: "A12"
    };
};

router.get("/ticket-pdf/:id", async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await getTicketById(ticketId);

        if (!ticket) {
            return res.status(404).send("Ticket not found");
        }

        // Create PDF
        const doc = new PDFDocument({ size: "A5", margin: 50 });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=ticket-${ticket.id}.pdf`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Draw ticket background
        doc.rect(0, 0, doc.page.width, doc.page.height)
            .fill("#f2f2f2"); // light gray background

        // Ticket Header
        doc.fillColor("#0077ff")
            .fontSize(22)
            .text(ticket.event, { align: "center" });

        doc.moveDown(0.5);
        doc.fontSize(12)
            .fillColor("black")
            .text(`Date: ${ticket.date}`, { align: "center" })
            .text(`Seat: ${ticket.seat}`, { align: "center" });

        doc.moveDown(1);

        // Attendee Info Box
        doc.rect(50, 150, 400, 120)
            .fill("#ffffff")
            .stroke();

        doc.fillColor("black")
            .fontSize(16)
            .text(`Ticket ID: ${ticket.id}`, 60, 160)
            .text(`Name: ${ticket.name}`, 60, 190)
            .text(`Email: ${ticket.email}`, 60, 220);

        // Powered by OxTech at bottom
        doc.fontSize(10)
            .fillColor("gray")
            .text("Powered by OxTech", { align: "center", baseline: "bottom" });

        // Finish PDF
        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

export default router;
