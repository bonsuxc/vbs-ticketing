import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { prisma } from "./utils/prisma";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./routes/auth.routes";
import { ticketRouter } from "./routes/ticket.routes";
import { eventRouter } from "./routes/event.routes";
import { paymentRouter } from "./routes/payment.routes";
import { userRouter } from "./routes/user.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { checkinRouter } from "./routes/checkin.routes";
import { exportRouter } from "./routes/export.routes";
import { activityRouter } from "./routes/activity.routes";

const app = express();

app.use(cors({ origin: process.env.ADMIN_FRONTEND_URL?.split(",") ?? "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/events", eventRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/users", userRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/checkin", checkinRouter);
app.use("/api/export", exportRouter);
app.use("/api/activity", activityRouter);

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 4000);

const server = createServer(app);

server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`✅ Admin backend listening on http://localhost:${PORT}`);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	server.close();
});

process.on("SIGINT", async () => {
	await prisma.$disconnect();
	server.close();
});

