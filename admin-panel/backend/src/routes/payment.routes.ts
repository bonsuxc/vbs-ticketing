import { Router } from "express";

export const paymentRouter = Router();

paymentRouter.get("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

paymentRouter.post("/report", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

paymentRouter.patch("/:id/status", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

