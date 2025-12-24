import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { LoginPage } from "./pages/Login.tsx";
import { DashboardPage } from "./pages/Dashboard.tsx";
import { TicketsPage } from "./pages/Tickets.tsx";
import { EventsPage } from "./pages/Events.tsx";
import { PaymentsPage } from "./pages/Payments.tsx";
import { UsersPage } from "./pages/Users.tsx";
import { SettingsPage } from "./pages/Settings.tsx";
import { CheckInPage } from "./pages/CheckIn.tsx";
import { ActivityLogPage } from "./pages/ActivityLog.tsx";
import AdminPage from "./pages/Admin.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AdminLayout, PublicLayout } from "./layouts/AdminLayout.tsx";
import { queryClient } from "./lib/queryClient.ts";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Routes>
					<Route element={<PublicLayout />}>
						<Route path="/login" element={<LoginPage />} />
					</Route>
					<Route element={<ProtectedRoute />}>
						<Route element={<App />}>
							<Route element={<AdminLayout />}>
								<Route path="/" element={<DashboardPage />} />
								<Route path="/dashboard" element={<DashboardPage />} />
								<Route path="/tickets" element={<TicketsPage />} />
								<Route path="/events" element={<EventsPage />} />
								<Route path="/payments" element={<PaymentsPage />} />
								<Route path="/checkin" element={<CheckInPage />} />
								<Route path="/activity" element={<ActivityLogPage />} />
								<Route path="/users" element={<UsersPage />} />
								<Route path="/settings" element={<SettingsPage />} />
								<Route path="/admin" element={<AdminPage />} />
							</Route>
						</Route>
					</Route>
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	</StrictMode>
);
