import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FiSearch, FiFilter, FiX, FiTrash2, FiEye, FiDownload } from "react-icons/fi";

export function PaymentsPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"UNUSED" | "USED" | "">("");
	const [showFilters, setShowFilters] = useState(false);
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["payments", { search, status: statusFilter }],
		queryFn: () =>
			api
				.get("/payments", { params: { search, status: statusFilter } })
				.then((r) => r.data),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => api.delete(`/payments/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
		},
	});

	const getStatusBadge = (status: string) => {
		if (status === "UNUSED") {
			return (
				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
					Unused
				</span>
			);
		}
		return (
			<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
				Used
			</span>
		);
	};

	return (
		<div className="space-y-4 p-4 md:p-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold text-gray-900">Payments</h1>
				<div className="flex gap-2">
					<button
						onClick={async () => {
							try {
								const response = await api.get("/export/payments/csv", {
									responseType: "blob",
								});
								const url = window.URL.createObjectURL(new Blob([response.data]));
								const link = document.createElement("a");
								link.href = url;
								link.setAttribute("download", `payments-${Date.now()}.csv`);
								document.body.appendChild(link);
								link.click();
								link.remove();
							} catch (error) {
								console.error("Export failed:", error);
								alert("Failed to export CSV");
							}
						}}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
					>
						<FiDownload className="h-4 w-4" />
						Export CSV
					</button>
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						<FiFilter className="h-4 w-4" />
						Filters
					</button>
				</div>
			</div>

			{/* Search - Full width on mobile */}
			<div className="relative">
				<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
				<input
					type="text"
					placeholder="Search by name, phone, or ticket code..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			{/* Filters - Collapsible on mobile */}
			{showFilters && (
				<div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="font-medium text-gray-900">Filters</h3>
						<button
							onClick={() => setShowFilters(false)}
							className="text-gray-400 hover:text-gray-600"
						>
							<FiX className="h-5 w-5" />
						</button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Ticket Status
							</label>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as any)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
							>
								<option value="">All</option>
								<option value="UNUSED">Unused</option>
								<option value="USED">Used</option>
							</select>
						</div>
					</div>
				</div>
			)}

			{/* Table - Responsive */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Ticket Code
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Phone
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Amount
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Method
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-4 py-8 text-center text-gray-500">
										Loading...
									</td>
								</tr>
							) : data?.data?.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-4 py-8 text-center text-gray-500">
										No payments found
									</td>
								</tr>
							) : (
								data?.data?.map((payment: any) => (
									<tr key={payment.id} className="hover:bg-gray-50">
										<td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{payment.ticketCode}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
											{payment.fullName}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
											{payment.phone}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											₵{Number(payment.amount).toFixed(2)}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
											{payment.method}
										</td>
										<td className="px-4 py-4 whitespace-nowrap">
											{getStatusBadge(payment.ticketStatus)}
										</td>
										<td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex gap-2">
												<button className="text-blue-600 hover:text-blue-900">
													<FiEye className="h-5 w-5" />
												</button>
												<button
													onClick={() => {
														if (confirm("Delete this payment?")) {
															deleteMutation.mutate(payment.id);
														}
													}}
													className="text-red-600 hover:text-red-900"
												>
													<FiTrash2 className="h-5 w-5" />
												</button>
											</div>
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
