import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FiClock, FiUser, FiTicket, FiTrash2, FiCheckCircle } from "react-icons/fi";
import dayjs from "dayjs";

export function ActivityLogPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["activity"],
		queryFn: () => api.get("/activity").then((r) => r.data),
	});

	const getActionIcon = (action: string) => {
		switch (action) {
			case "TICKET_CHECKED_IN":
				return <FiCheckCircle className="h-5 w-5 text-green-600" />;
			case "TICKET_DELETED":
				return <FiTrash2 className="h-5 w-5 text-red-600" />;
			default:
				return <FiTicket className="h-5 w-5 text-blue-600" />;
		}
	};

	const getActionColor = (action: string) => {
		if (action.includes("CHECKED_IN")) return "bg-green-100 text-green-800";
		if (action.includes("DELETED")) return "bg-red-100 text-red-800";
		return "bg-blue-100 text-blue-800";
	};

	return (
		<div className="space-y-4 p-4 md:p-6">
			<h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Time
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Action
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Description
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Admin
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Ticket
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{isLoading ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
										Loading...
									</td>
								</tr>
							) : data?.data?.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
										No activity recorded
									</td>
								</tr>
							) : (
								data?.data?.map((log: any) => (
									<tr key={log.id} className="hover:bg-gray-50">
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
											<div className="flex items-center gap-2">
												<FiClock className="h-4 w-4" />
												{dayjs(log.createdAt).format("MMM D, YYYY h:mm A")}
											</div>
										</td>
										<td className="px-4 py-4 whitespace-nowrap">
											<span
												className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
													log.action
												)}`}
											>
												{getActionIcon(log.action)}
												{log.action.replace(/_/g, " ")}
											</span>
										</td>
										<td className="px-4 py-4 text-sm text-gray-900">
											{log.description}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
											{log.adminName}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{log.ticketCode || "—"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

