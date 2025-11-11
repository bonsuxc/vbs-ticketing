import { create } from "zustand";
import type { AdminRole } from "../types";

type AdminUser = {
	id: string;
	email: string;
	fullName: string;
	role: AdminRole;
};

type AuthState = {
	user: AdminUser | null;
	token: string | null;
	setAuth: (payload: { user: AdminUser; token: string }) => void;
	clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	token: null,
	setAuth: ({ user, token }) => set({ user, token }),
	clear: () => set({ user: null, token: null }),
}));

