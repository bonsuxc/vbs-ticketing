export type AdminRole = "SUPER_ADMIN" | "TICKET_MANAGER" | "FINANCE";

export type TicketStatus = "ACTIVE" | "CANCELLED" | "REDEEMED" | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIAL";

export type TicketType = "REGULAR" | "VIP" | "STAFF" | "CHILD";

export type DashboardSummary = {
	totalRevenue: number;
	totalTickets: number;
	upcomingEvents: number;
	pendingPayments: number;
	recentSales: Array<{
		id: string;
		eventName: string;
		customerName: string;
		amount: number;
		status: PaymentStatus;
		createdAt: string;
	}>;
};

