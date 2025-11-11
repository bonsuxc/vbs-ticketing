import { Router } from "express";

export const dashboardRouter = Router();

dashboardRouter.get("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

