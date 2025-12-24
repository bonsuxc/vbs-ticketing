import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { z } from "zod";

const activityQuerySchema = z.object({
	page: z.coerce.number().default(1),
	limit: z.coerce.number().default(50),
	action: z.string().optional(),
});

export async function getActivityLogs(req: Request, res: Response) {
	try {
		const query = activityQuerySchema.parse(req.query);
		const skip = (query.page - 1) * query.limit;

		const where: any = {};
		if (query.action) {
			where.action = query.action;
		}

		const [logs, total] = await Promise.all([
			prisma.activityLog.findMany({
				where,
				include: {
					admin: {
						select: {
							fullName: true,
							email: true,
						},
					},
					ticket: {
						select: {
							code: true,
							customer: {
								select: {
									fullName: true,
								},
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: query.limit,
			}),
			prisma.activityLog.count({ where }),
		]);

		res.json({
			data: logs.map((log) => ({
				id: log.id,
				action: log.action,
				description: log.description,
				adminName: log.admin.fullName,
				adminEmail: log.admin.email,
				ticketCode: log.ticket?.code,
				customerName: log.ticket?.customer?.fullName,
				createdAt: log.createdAt,
				metadata: log.metadata,
			})),
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages: Math.ceil(total / query.limit),
			},
		});
	} catch (error) {
		console.error("Get activity logs error:", error);
		res.status(500).json({ error: "Failed to fetch activity logs" });
	}
}

