import { Router } from "express";

export const userRouter = Router();

userRouter.get("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

userRouter.patch("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

userRouter.delete("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

userRouter.patch("/:id/status", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

