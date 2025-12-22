import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import dayjs from "dayjs";
import { FiDollarSign, FiUsers, FiCalendar, FiCheckCircle, FiAlertCircle, FiDownload, FiClock } from "react-icons/fi";
import { mockDashboardData } from "../mockData";

const chartPalette = ["#6366f1", "#22d3ee", "#fbbf24", "#f472b6", "#10b981"];

export function DashboardPage() {
	const [data, setData] = useState(mockDashboardData);
	const [isLoading, setIsLoading] = useState(false);
	const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

	// In a real app, you would fetch data here
	useEffect(() => {
		// Simulate loading
		setIsLoading(true);
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 500);
		return () => clearTimeout(timer);
	}, [timeRange]);

	// Filter sales data based on selected time range
	const filteredSalesData = timeRange === '7days' 
		? data.salesTrend.slice(-7) 
		: data.salesTrend;

	const salesData = filteredSalesData.map(item => ({
		...item,
		tickets: item.tickets ?? 0,
	}));

const ticketSummary = [
	{ name: "Paid", value: data.paidTickets },
	{ name: "Pending", value: data.pendingPayments },
];

const recentActivities = [
	{ id: 1, type: 'payment', user: 'John Doe', amount: 50, status: 'completed', time: '2 min ago' },
	{ id: 2, type: 'ticket', user: 'Jane Smith', event: 'VBS 2025', status: 'checked-in', time: '10 min ago' },
	{ id: 3, type: 'payment', user: 'Mike Johnson', amount: 30, status: 'pending', time: '25 min ago' },
	{ id: 4, type: 'refund', user: 'Sarah Williams', amount: 25, status: 'completed', time: '1 hour ago' },
];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
				<p className="text-sm text-slate-500">Stay on top of VBS ticket sales, events, and payments.</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard 
					icon={<FiDollarSign className="h-5 w-5 text-indigo-500" />}
					title="Total Revenue" 
					value={`₵${(data?.totalRevenue ?? 0).toLocaleString()}`} 
					trend="+12.5%"
					trendType="up"
				/>
				<StatCard 
					icon={<FiUsers className="h-5 w-5 text-cyan-400" />}
					title="Total Tickets" 
					value={data?.totalTickets.toLocaleString() ?? "0"} 
					trend="+8.2%"
					trendType="up"
				/>
				<StatCard 
					icon={<FiCheckCircle className="h-5 w-5 text-emerald-500" />}
					title="Paid Tickets" 
					value={data?.paidTickets?.toLocaleString() ?? "0"}
					subtitle={`of ${data?.totalTickets ?? 0}`}
				/>
				<StatCard 
					icon={<FiAlertCircle className="h-5 w-5 text-amber-500" />}
					title="Pending Payment" 
					value={data?.pendingPayments?.toString() ?? "0"}
					trend="+3.1%"
					trendType="down"
				/>
				<StatCard 
					icon={<FiDollarSign className="h-5 w-5 text-green-500" />}
					title="Today's Payments" 
					value={`₵${(data?.todaysPayments ?? 0).toLocaleString()}`}
					subtitle={`${data?.todaysTickets ?? 0} tickets`}
				/>
				<StatCard 
					icon={<FiCalendar className="h-5 w-5 text-purple-500" />}
					title="Upcoming Events" 
					value={data?.upcomingEvents?.toString() ?? "0"}
					subtitle="Next 7 days"
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Revenue & Tickets Chart */}
				<div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 lg:col-span-2">
					<header className="mb-4 flex items-center justify-between">
						<h2 className="text-base font-semibold text-slate-900">Revenue & Tickets Trend</h2>
						<div className="flex space-x-2">
							<button 
								onClick={() => setTimeRange('7days')}
								className={`px-3 py-1 text-xs font-medium rounded-lg ${timeRange === '7days' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
							>
								7 Days
							</button>
							<button 
								onClick={() => setTimeRange('30days')}
								className={`px-3 py-1 text-xs font-medium rounded-lg ${timeRange === '30days' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
							>
								30 Days
							</button>
						</div>
					</header>
					<div className="h-80">
						{isLoading ? (
							<Skeleton />
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart 
	data={salesData} 
	margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
>
									<defs>
										<linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
											<stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
											<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
										</linearGradient>
									</defs>
									<XAxis 
										dataKey="date" 
										tick={{ fontSize: 12 }}
									/>
									<YAxis 
										yAxisId="left" 
										orientation="left" 
										stroke="#6366f1" 
										tickFormatter={(value) => `₵${value}`}
									/>
									<YAxis 
										yAxisId="right" 
										orientation="right" 
										stroke="#10b981" 
									/>
									<Tooltip 
										formatter={(value, name) => {
											if (name === 'amount') return [`₵${value}`, 'Revenue'];
											if (name === 'tickets') return [value, 'Tickets'];
											return [value, name];
										}}
									/>
									<Legend />
									<Area
										yAxisId="left"
										type="monotone"
										dataKey="amount"
										name="Revenue"
										stroke="#6366f1"
										fillOpacity={1}
										fill="url(#colorAmount)"
									/>
									<Area
										yAxisId="right"
										type="monotone"
										dataKey="tickets"
										name="Tickets"
										stroke="#10b981"
										fillOpacity={1}
										fill="url(#colorTickets)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>

				{/* Right Sidebar */}
				<div className="space-y-6">
					{/* Ticket Status */}
					<div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
						<header className="mb-4">
							<h2 className="text-base font-semibold text-slate-900">Ticket Status</h2>
						</header>
						<div className="h-48">
							{isLoading ? (
								<Skeleton />
							) : (
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={ticketSummary}
											cx="50%"
											cy="50%"
											innerRadius={40}
											outerRadius={60}
											paddingAngle={2}
											dataKey="value"
										>
											{ticketSummary.map((entry, index) => (
												<Cell 
													key={`cell-${index}`} 
													fill={chartPalette[index % chartPalette.length]} 
												/>
											))}
										</Pie>
										<Tooltip 
											formatter={(value, name, props) => {
												const percent = ((value as number) / data.totalTickets * 100).toFixed(1);
												return [`${value} (${percent}%)`, props.payload?.payload?.name || ''];
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							)}
						</div>
						<div className="mt-4 space-y-2">
							{ticketSummary.map((item, index) => (
								<div key={item.name} className="flex items-center justify-between">
									<div className="flex items-center">
										<div
											className="mr-2 h-3 w-3 rounded-full"
											style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
										/>
										<span className="text-sm font-medium text-slate-700">{item.name}</span>
									</div>
									<span className="text-sm font-semibold text-slate-900">
										{item.name === 'Paid' ? '₵' : ''}{item.value.toLocaleString()}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Recent Activity */}
					<div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
						<header className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
							<button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
								View All
							</button>
						</header>
						<div className="space-y-4">
							{recentActivities.map((activity) => (
								<div key={activity.id} className="flex items-start">
									<div className="mr-3 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50">
										{activity.type === 'payment' ? (
											<FiDollarSign className="h-4 w-4 text-indigo-600" />
										) : activity.type === 'ticket' ? (
											<FiUsers className="h-4 w-4 text-green-600" />
										) : (
											<FiDownload className="h-4 w-4 text-amber-600" />
										)}
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-slate-900">
												{activity.type === 'payment' && `Payment from ${activity.user}`}
												{activity.type === 'ticket' && `Ticket for ${activity.event}`}
												{activity.type === 'refund' && `Refund for ${activity.user}`}
											</span>
											<span className="text-xs text-slate-500">{activity.time}</span>
										</div>
										<div className="mt-0.5 flex items-center">
											{activity.amount && (
												<span className="text-sm font-medium text-slate-700">
													₵{activity.amount}
												</span>
											)}
											<span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
												activity.status === 'completed' 
													? 'bg-green-100 text-green-800' 
													: activity.status === 'pending'
													? 'bg-amber-100 text-amber-800'
													: 'bg-blue-100 text-blue-800'
											}`}>
												{activity.status}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
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
							{data.recentSales.map((sale) => (
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
					{data.recentSales.length === 0 ? (
						<p className="py-6 text-center text-sm text-slate-500">No sales recorded yet.</p>
					) : null}
				</div>
			</div>
		</div>
	);
}

function StatCard({ 
	title, 
	value, 
	subtitle, 
	trend, 
	trendType = 'up',
	icon
}: { 
	title: string; 
	value: string | number; 
	subtitle?: string;
	trend?: string;
	trendType?: 'up' | 'down';
	icon?: React.ReactNode;
}) {
	const trendColor = trendType === 'up' ? 'text-green-500' : 'text-red-500';
	const trendIcon = trendType === 'up' ? '↑' : '↓';

	return (
		<div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					{icon && (
						<div className="p-2 rounded-lg bg-indigo-50">
							{icon}
						</div>
					)}
					<dt className="text-sm font-medium text-slate-500">{title}</dt>
				</div>
				{trend && (
					<span className={`text-xs font-medium ${trendColor}`}>
						{trendIcon} {trend}
					</span>
				)}
			</div>
			<dd className="mt-3 text-2xl font-semibold text-slate-900">{value}</dd>
			{subtitle && (
				<dd className="mt-1 text-sm text-slate-500">{subtitle}</dd>
			)}
		</div>
	);
};

function Skeleton() {
	return <div className="h-full animate-pulse rounded-xl bg-slate-100" />;
}
