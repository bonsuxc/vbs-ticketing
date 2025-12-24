import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FiDollarSign, FiUsers, FiCheckCircle, FiCalendar } from "react-icons/fi";

export function DashboardPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard"],
		queryFn: () => api.get("/dashboard/stats").then((r) => r.data),
	});

	const stats = [
		{
			title: "Total Tickets",
			value: data?.totalTickets || 0,
			icon: <FiUsers className="h-6 w-6" />,
			color: "bg-blue-500",
		},
		{
			title: "Total Paid",
			value: data?.paidTickets || 0,
			icon: <FiCheckCircle className="h-6 w-6" />,
			color: "bg-green-500",
		},
		{
			title: "Total Collected",
			value: `₵${Number(data?.totalAmount || 0).toLocaleString()}`,
			icon: <FiDollarSign className="h-6 w-6" />,
			color: "bg-purple-500",
		},
		{
			title: "Today's Payments",
			value: `₵${Number(data?.paymentsToday || 0).toLocaleString()}`,
			subtitle: `${data?.ticketsToday || 0} tickets`,
			icon: <FiCalendar className="h-6 w-6" />,
			color: "bg-orange-500",
		},
	];

	return (
		<div className="space-y-6 p-4 md:p-6">
			<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

			{/* Mobile-first cards - stack vertically */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, idx) => (
					<div
						key={idx}
						className="bg-white rounded-lg shadow p-6 border border-gray-200"
					>
						<div className="flex items-center justify-between mb-4">
							<div className={`${stat.color} p-3 rounded-lg text-white`}>
								{stat.icon}
							</div>
						</div>
						<p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
						<p className="text-3xl font-bold text-gray-900">{stat.value}</p>
						{stat.subtitle && (
							<p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
