import "dotenv/config";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";

async function main() {
	console.log("🌱 Seeding database with sample data...");

	await prisma.payment.deleteMany();
	await prisma.ticket.deleteMany();
	await prisma.customer.deleteMany();
	await prisma.event.deleteMany();
	await prisma.adminSession.deleteMany();
	await prisma.adminUser.deleteMany();

	const superAdminPassword = await bcrypt.hash("SuperAdmin123!", 10);
	const managerPassword = await bcrypt.hash("TicketManager123!", 10);

	const superAdmin = await prisma.adminUser.create({
		data: {
			email: "superadmin@vbs.com",
			fullName: "Super Admin",
			passwordHash: superAdminPassword,
			role: "SUPER_ADMIN",
		},
	});

	const ticketManager = await prisma.adminUser.create({
		data: {
			email: "manager@vbs.com",
			fullName: "Ticket Manager",
			passwordHash: managerPassword,
			role: "TICKET_MANAGER",
		},
	});

	const event = await prisma.event.create({
		data: {
			name: "VBS 2025 Main Event",
			description: "Vacation Bible School 2025 flagship event.",
			location: "Faith Chapel Auditorium",
			startDate: new Date("2025-12-15T09:00:00Z"),
			endDate: new Date("2025-12-15T17:00:00Z"),
			ticketPrice: 300,
			capacity: 500,
			published: true,
		},
	});

	const customer = await prisma.customer.create({
		data: {
			fullName: "Akosua Mensah",
			email: "akosua@example.com",
			phone: "+233200000000",
		},
	});

	const ticket = await prisma.ticket.create({
		data: {
			code: "VBS-1A2B3C",
			ticketType: "REGULAR",
			price: 300,
			status: "ACTIVE",
			paymentStatus: "PAID",
			eventId: event.id,
			customerId: customer.id,
			qrPayload: `https://example.com/tickets/VBS-1A2B3C`,
		},
	});

	await prisma.payment.create({
		data: {
			ticketId: ticket.id,
			amount: 300,
			status: "PAID",
			provider: "Manual",
			reference: "MANUAL-123456",
			receivedAt: new Date(),
		},
	});

	// Notification model removed - no longer needed

	console.log("✅ Seed completed successfully.");
	console.log("Super admin credentials -> email: superadmin@vbs.com | password: SuperAdmin123!");
	console.log("Ticket manager credentials -> email: manager@vbs.com | password: TicketManager123!");
}

main()
	.catch((error) => {
		console.error("Seed failed", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

