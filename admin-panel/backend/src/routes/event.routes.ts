import { Router } from "express";

export const eventRouter = Router();

eventRouter.get("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

eventRouter.post("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

eventRouter.get("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

eventRouter.put("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

eventRouter.delete("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

