import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DashboardSummary } from "../types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import dayjs from "dayjs";

const chartPalette = ["#6366f1", "#22d3ee", "#fbbf24", "#f472b6"];

export function DashboardPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard"],
		queryFn: async () => {
			const response = await api.get<{ data: DashboardSummary }>("/dashboard");
			return response.data.data;
		},
	});

	const salesData =
		data?.recentSales.map((item) => ({
			date: dayjs(item.createdAt).format("MMM D"),
			amount: item.amount,
		})) ?? [];

	const ticketSummary = [
		{ name: "Paid", value: data?.totalTickets ?? 0 },
		{ name: "Pending", value: data?.pendingPayments ?? 0 },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
				<p className="text-sm text-slate-500">Stay on top of VBS ticket sales, events, and payments.</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard title="Total Revenue" value={`₵${(data?.totalRevenue ?? 0).toLocaleString()}`} />
				<StatCard title="Tickets Sold" value={data?.totalTickets.toLocaleString() ?? "0"} />
				<StatCard title="Upcoming Events" value={data?.upcomingEvents.toString() ?? "0"} />
				<StatCard title="Pending Payments" value={data?.pendingPayments.toString() ?? "0"} />
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
					<header className="mb-4 flex items-center justify-between">
						<h2 className="text-base font-semibold text-slate-900">Revenue Trend</h2>
					</header>
					<div className="h-64">
						{isLoading ? (
							<Skeleton />
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={salesData}>
									<defs>
										<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
											<stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
										</linearGradient>
									</defs>
									<XAxis dataKey="date" stroke="#94a3b8" />
									<YAxis stroke="#94a3b8" />
									<Tooltip />
									<Area type="monotone" dataKey="amount" stroke="#4338ca" fill="url(#colorRevenue)" />
								</AreaChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				<div className="rounded-2xl bg-white p-6 shadow-sm">
					<header className="mb-4">
						<h2 className="text-base font-semibold text-slate-900">Ticket Status</h2>
					</header>
					<div className="h-64">
						{isLoading ? (
							<Skeleton />
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={ticketSummary} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
										{ticketSummary.map((entry, index) => (
											<Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-white p-6 shadow-sm">
				<header className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold text-slate-900">Recent Ticket Sales</h2>
				</header>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-sm">
						<thead>
							<tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-4 py-3">Event</th>
								<th className="px-4 py-3">Customer</th>
								<th className="px-4 py-3">Amount</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3">Date</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{data?.recentSales.map((sale) => (
								<tr key={sale.id} className="text-slate-700">
									<td className="px-4 py-3 font-medium text-slate-900">{sale.eventName}</td>
									<td className="px-4 py-3">{sale.customerName}</td>
									<td className="px-4 py-3 font-medium text-slate-900">₵{sale.amount.toFixed(2)}</td>
									<td className="px-4 py-3">
										<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
											{sale.status}
										</span>
									</td>
									<td className="px-4 py-3 text-slate-500">{dayjs(sale.createdAt).format("MMM D, YYYY")}</td>
								</tr>
							))}
						</tbody>
					</table>
					{data?.recentSales.length === 0 ? (
						<p className="py-6 text-center text-sm text-slate-500">No sales recorded yet.</p>
					) : null}
				</div>
			</div>
		</div>
	);
}

function StatCard({ title, value }: { title: string; value: string }) {
	return (
		<div className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
			<h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
			<p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
		</div>
	);
}

function Skeleton() {
	return <div className="h-full animate-pulse rounded-xl bg-slate-100" />;
}

