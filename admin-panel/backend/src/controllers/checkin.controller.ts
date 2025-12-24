import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z } from "zod";

const checkInSchema = z.object({
	ticketCode: z.string(),
});

export async function checkInTicket(req: Request, res: Response) {
	try {
		const { ticketCode } = checkInSchema.parse(req.body);
		const adminId = (req as any).adminId;

		const ticket = await prisma.ticket.findUnique({
			where: { code: ticketCode.toUpperCase() },
			include: { customer: true, event: true },
		});

		if (!ticket) {
			return res.status(404).json({ error: "Ticket not found" });
		}

		if (ticket.status === "USED") {
			return res.status(400).json({ error: "Ticket already used" });
		}

		if (ticket.paymentStatus !== "PAID") {
			return res.status(400).json({ error: "Ticket not paid" });
		}

		// Mark as used
		const updated = await prisma.ticket.update({
			where: { id: ticket.id },
			data: {
				status: "USED",
				checkedInAt: new Date(),
			},
		});

		// Log activity
		await prisma.activityLog.create({
			data: {
				action: "TICKET_CHECKED_IN",
				description: `Checked in ticket ${ticket.code} for ${ticket.customer.fullName}`,
				adminId,
				ticketId: ticket.id,
			},
		});

		res.json({
			success: true,
			ticket: {
				code: updated.code,
				fullName: ticket.customer.fullName,
				phone: ticket.customer.phone,
				status: updated.status,
			},
		});
	} catch (error) {
		console.error("Check-in error:", error);
		res.status(500).json({ error: "Failed to check in ticket" });
	}
}

