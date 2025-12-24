import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import dayjs from "dayjs";

export async function getDashboardStats(req: Request, res: Response) {
	try {
		const today = dayjs().startOf("day").toDate();
		const todayEnd = dayjs().endOf("day").toDate();

		// Total tickets (all paid tickets)
		const totalTickets = await prisma.ticket.count({
			where: { paymentStatus: "PAID" },
		});

		// Total paid tickets (same as total, but explicit)
		const paidTickets = totalTickets;

		// Total amount collected
		const totalAmountResult = await prisma.payment.aggregate({
			_sum: { amount: true },
			where: { status: "PAID" },
		});
		const totalAmount = totalAmountResult._sum.amount || 0;

		// Payments made today
		const todayPaymentsResult = await prisma.payment.aggregate({
			_sum: { amount: true },
			_count: { id: true },
			where: {
				status: "PAID",
				receivedAt: {
					gte: today,
					lte: todayEnd,
				},
			},
		});
		const paymentsToday = todayPaymentsResult._sum.amount || 0;
		const ticketsToday = todayPaymentsResult._count.id || 0;

		res.json({
			totalTickets,
			paidTickets,
			totalAmount: totalAmount.toString(),
			paymentsToday: paymentsToday.toString(),
			ticketsToday,
		});
	} catch (error) {
		console.error("Dashboard stats error:", error);
		res.status(500).json({ error: "Failed to fetch dashboard stats" });
	}
}

