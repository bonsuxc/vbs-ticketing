import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export async function exportPaymentsCSV(req: Request, res: Response) {
	try {
		const payments = await prisma.payment.findMany({
			where: { status: "PAID" },
			include: {
				ticket: {
					include: {
						customer: true,
						event: true,
					},
				},
			},
			orderBy: { receivedAt: "desc" },
		});

		// CSV header
		const headers = [
			"Ticket ID",
			"Ticket Code",
			"Full Name",
			"Phone",
			"Amount (₵)",
			"Payment Method",
			"Date Paid",
			"Ticket Status",
		];

		// CSV rows
		const rows = payments.map((p) => [
			p.ticket.id,
			p.ticket.code,
			p.ticket.customer.fullName,
			p.ticket.customer.phone || "",
			p.amount.toString(),
			p.method,
			p.receivedAt.toISOString(),
			p.ticket.status,
		]);

		const csv = [
			headers.join(","),
			...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
		].join("\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename=payments-${Date.now()}.csv`);
		res.send(csv);
	} catch (error) {
		console.error("Export error:", error);
		res.status(500).json({ error: "Failed to export payments" });
	}
}

