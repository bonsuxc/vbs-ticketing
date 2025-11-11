import { AdminRole } from "@prisma/client";

export type AuthenticatedAdmin = {
	id: string;
	email: string;
	fullName: string;
	role: AdminRole;
};

