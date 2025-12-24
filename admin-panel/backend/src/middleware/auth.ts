import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
	try {
		const token = req.cookies?.admin_session || req.headers.authorization?.replace("Bearer ", "");

		if (!token) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const session = await prisma.adminSession.findUnique({
			where: { token },
			include: { admin: true },
		});

		if (!session || session.expiresAt < new Date()) {
			return res.status(401).json({ error: "Session expired" });
		}

		if (session.admin.status !== "ACTIVE") {
			return res.status(403).json({ error: "Account suspended" });
		}

		(req as any).adminId = session.adminId;
		(req as any).admin = session.admin;
		next();
	} catch (error) {
		console.error("Auth middleware error:", error);
		res.status(401).json({ error: "Unauthorized" });
	}
}

