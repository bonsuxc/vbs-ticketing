import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

authRouter.post("/logout", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

authRouter.post("/refresh", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

