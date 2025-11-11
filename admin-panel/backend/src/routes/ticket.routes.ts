import { Router } from "express";

export const ticketRouter = Router();

ticketRouter.get("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

ticketRouter.post("/", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

ticketRouter.get("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

ticketRouter.put("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

ticketRouter.delete("/:id", (req, res) => {
	res.status(501).json({ message: "Not implemented yet" });
});

