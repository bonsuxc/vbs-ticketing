import { Outlet, NavLink } from "react-router-dom";
import { useAuthStore } from "../hooks/useAuthStore";
import { clsx } from "clsx";
import { Fragment, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const navItems = [
	{ to: "/", label: "Dashboard" },
	{ to: "/payments", label: "Payments" },
	{ to: "/checkin", label: "Check-In" },
	{ to: "/activity", label: "Activity Log" },
];

export function AdminLayout() {
	const user = useAuthStore((state) => state.user);
	const clear = useAuthStore((state) => state.clear);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Mobile menu button */}
			<div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
				<div className="flex items-center justify-between p-4">
					<h1 className="text-lg font-bold">VBS Admin</h1>
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-2 text-gray-600"
					>
						{mobileMenuOpen ? (
							<FiX className="h-6 w-6" />
						) : (
							<FiMenu className="h-6 w-6" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile sidebar */}
			{mobileMenuOpen && (
				<div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
					<div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
						<div className="p-4 pt-16">
							<nav className="space-y-2">
								{navItems.map((item) => (
									<NavLink
										key={item.to}
										to={item.to}
										onClick={() => setMobileMenuOpen(false)}
										className={({ isActive }) =>
											clsx(
												"block px-4 py-3 text-base font-medium rounded-lg",
												isActive
													? "bg-blue-50 text-blue-700"
													: "text-gray-700 hover:bg-gray-100"
											)
										}
									>
										{item.label}
									</NavLink>
								))}
							</nav>
							<div className="mt-6 pt-6 border-t border-gray-200">
								<p className="px-4 text-sm text-gray-500">{user?.fullName ?? "Admin"}</p>
								<button
									onClick={clear}
									className="mt-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
								>
									Log out
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Desktop sidebar */}
			<div className="hidden lg:flex lg:flex-shrink-0">
				<div className="flex flex-col w-64">
					<div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
						<div className="px-4 mb-4">
							<h1 className="text-lg font-bold text-gray-900">VBS Admin</h1>
						</div>
						<nav className="mt-5 flex-1 px-2 space-y-1">
							{navItems.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									className={({ isActive }) =>
										clsx(
											"group flex items-center px-2 py-2 text-sm font-medium rounded-md",
											isActive
												? "bg-blue-50 text-blue-700"
												: "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
										)
									}
								>
									{item.label}
								</NavLink>
							))}
						</nav>
						<div className="px-4 pt-4 border-t border-gray-200">
							<p className="text-sm font-medium text-gray-900">{user?.fullName ?? "Admin"}</p>
							<button
								onClick={clear}
								className="mt-2 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
							>
								Log out
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="lg:pl-64">
				<div className="pt-16 lg:pt-0">
					<main className="py-6">{<Outlet />}</main>
				</div>
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

