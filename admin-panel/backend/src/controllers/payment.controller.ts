import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z } from "zod";

const searchSchema = z.object({
	search: z.string().optional(),
	status: z.enum(["UNUSED", "USED"]).optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	page: z.coerce.number().default(1),
	limit: z.coerce.number().default(50),
});

export async function getPayments(req: Request, res: Response) {
	try {
		const query = searchSchema.parse(req.query);
		const skip = (query.page - 1) * query.limit;

		const where: any = {
			status: "PAID", // Only paid payments
			ticket: {
				paymentStatus: "PAID",
			},
		};

		// Search by name, phone, or ticket code
		if (query.search) {
			where.OR = [
				{ ticket: { customer: { fullName: { contains: query.search, mode: "insensitive" } } } },
				{ ticket: { customer: { phone: { contains: query.search, mode: "insensitive" } } } },
				{ ticket: { code: { contains: query.search, mode: "insensitive" } } },
			];
		}

		// Filter by ticket status
		if (query.status) {
			where.ticket.status = query.status;
		}

		// Date range filter
		if (query.dateFrom || query.dateTo) {
			where.receivedAt = {};
			if (query.dateFrom) {
				where.receivedAt.gte = new Date(query.dateFrom);
			}
			if (query.dateTo) {
				where.receivedAt.lte = new Date(query.dateTo);
			}
		}

		const [payments, total] = await Promise.all([
			prisma.payment.findMany({
				where,
				include: {
					ticket: {
						include: {
							customer: true,
							event: true,
						},
					},
				},
				orderBy: { receivedAt: "desc" },
				skip,
				take: query.limit,
			}),
			prisma.payment.count({ where }),
		]);

		res.json({
			data: payments.map((p) => ({
				id: p.id,
				ticketId: p.ticket.id,
				ticketCode: p.ticket.code,
				fullName: p.ticket.customer.fullName,
				phone: p.ticket.customer.phone,
				amount: p.amount.toString(),
				method: p.method,
				datePaid: p.receivedAt,
				ticketStatus: p.ticket.status,
			})),
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages: Math.ceil(total / query.limit),
			},
		});
	} catch (error) {
		console.error("Get payments error:", error);
		res.status(500).json({ error: "Failed to fetch payments" });
	}
}

export async function deletePayment(req: Request, res: Response) {
	try {
		const { id } = req.params;
		const adminId = (req as any).adminId;

		const payment = await prisma.payment.findUnique({
			where: { id },
			include: { ticket: true },
		});

		if (!payment) {
			return res.status(404).json({ error: "Payment not found" });
		}

		// Log activity
		await prisma.activityLog.create({
			data: {
				action: "TICKET_DELETED",
				description: `Deleted payment and ticket ${payment.ticket.code}`,
				adminId,
				ticketId: payment.ticketId,
			},
		});

		// Delete payment (cascade deletes ticket)
		await prisma.payment.delete({ where: { id } });

		res.json({ success: true });
	} catch (error) {
		console.error("Delete payment error:", error);
		res.status(500).json({ error: "Failed to delete payment" });
	}
}

