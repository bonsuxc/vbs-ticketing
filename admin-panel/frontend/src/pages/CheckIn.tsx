import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { FiCheckCircle, FiXCircle, FiSearch } from "react-icons/fi";

export function CheckInPage() {
	const [ticketCode, setTicketCode] = useState("");
	const [result, setResult] = useState<any>(null);

	const checkInMutation = useMutation({
		mutationFn: (code: string) =>
			api.post("/checkin", { ticketCode: code }).then((r) => r.data),
		onSuccess: (data) => {
			setResult({ success: true, data });
			setTicketCode("");
			setTimeout(() => setResult(null), 3000);
		},
		onError: (error: any) => {
			setResult({
				success: false,
				error: error.response?.data?.error || "Failed to check in",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!ticketCode.trim()) return;
		checkInMutation.mutate(ticketCode.trim().toUpperCase());
	};

	return (
		<div className="max-w-md mx-auto p-4 md:p-6">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">Check-In</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Ticket Code
					</label>
					<div className="relative">
						<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
						<input
							type="text"
							value={ticketCode}
							onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
							placeholder="Enter or scan ticket code"
							className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							autoFocus
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={checkInMutation.isPending}
					className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{checkInMutation.isPending ? "Checking..." : "Check In"}
				</button>
			</form>

			{result && (
				<div
					className={`mt-6 p-4 rounded-lg ${
						result.success
							? "bg-green-50 border border-green-200"
							: "bg-red-50 border border-red-200"
					}`}
				>
					<div className="flex items-center gap-3">
						{result.success ? (
							<FiCheckCircle className="h-6 w-6 text-green-600" />
						) : (
							<FiXCircle className="h-6 w-6 text-red-600" />
						)}
						<div>
							{result.success ? (
								<>
									<p className="font-semibold text-green-900">
										Check-in successful!
									</p>
									<p className="text-sm text-green-700">
										{result.data.ticket.fullName}
									</p>
								</>
							) : (
								<p className="font-semibold text-red-900">{result.error}</p>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

