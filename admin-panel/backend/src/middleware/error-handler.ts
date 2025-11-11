import { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
	// eslint-disable-next-line no-console
	console.error(err);
	const status = typeof err === "object" && err !== null && "status" in err ? Number((err as any).status) : 500;
	const message =
		typeof err === "object" && err !== null && "message" in err ? String((err as any).message) : "Internal Server Error";

	res.status(Number.isInteger(status) ? status : 500).json({
		error: {
			message,
		},
	});
}

