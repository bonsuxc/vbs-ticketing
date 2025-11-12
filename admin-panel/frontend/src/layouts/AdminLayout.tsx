import { Outlet, NavLink } from "react-router-dom";
import { useAuthStore } from "../hooks/useAuthStore";
import { clsx } from "clsx";
import { Fragment } from "react";

const navItems = [
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/tickets", label: "Tickets" },
	{ to: "/events", label: "Events" },
	{ to: "/payments", label: "Payments" },
	{ to: "/users", label: "Users" },
	{ to: "/verify", label: "Verify Ticket" },
	{ to: "/settings", label: "Settings" },
];

export function AdminLayout() {
	const user = useAuthStore((state) => state.user);
	const clear = useAuthStore((state) => state.clear);

	return (
		<div className="min-h-screen bg-slate-100">
			<header className="bg-white shadow-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-semibold">
							VBS
						</div>
						<div>
							<p className="text-sm font-semibold text-slate-900">VBS Ticketing Admin</p>
							<p className="text-xs text-slate-500">Manage events, tickets & payments</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="text-right">
							<p className="text-sm font-medium text-slate-900">{user?.fullName ?? "Admin"}</p>
							<p className="text-xs text-slate-500">{user?.role ?? "Role"}</p>
						</div>
						<button
							onClick={clear}
							className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
						>
							Log out
						</button>
					</div>
				</div>
			</header>

			<div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
				<aside className="hidden w-56 flex-shrink-0 rounded-xl bg-white p-4 shadow-sm md:block">
					<nav className="space-y-1">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }) =>
									clsx(
										"flex items-center rounded-md px-3 py-2 text-sm font-medium transition",
										isActive
											? "bg-brand-50 text-brand-700"
											: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
									)
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
				</aside>

				<main className="flex-1 space-y-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

export function PublicLayout() {
	return (
		<Fragment>
			<Outlet />
		</Fragment>
	);
}

