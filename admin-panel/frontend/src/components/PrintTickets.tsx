import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface Ticket {
	id: string;
	code: string;
	customer: {
		fullName: string;
	};
	status: string;
}

interface PrintTicketsProps {
	tickets: Ticket[];
	onClose: () => void;
}

export function PrintTickets({ tickets, onClose }: PrintTicketsProps) {
	const [ticketsPerPage, setTicketsPerPage] = useState(4);
	const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

	// Generate QR codes
	useEffect(() => {
		tickets.forEach(async (ticket) => {
			try {
				const qr = await QRCode.toDataURL(ticket.code);
				setQrCodes((prev) => ({ ...prev, [ticket.code]: qr }));
			} catch (err) {
				console.error("QR generation error:", err);
			}
		});
	}, [tickets]);

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
				<div className="p-6 border-b no-print">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-bold">Print Tickets</h2>
						<button
							onClick={onClose}
							className="text-gray-500 hover:text-gray-700"
						>
							✕
						</button>
					</div>
					<div className="flex gap-4 items-center">
						<label className="text-sm font-medium">
							Tickets per page:
							<select
								value={ticketsPerPage}
								onChange={(e) => setTicketsPerPage(Number(e.target.value))}
								className="ml-2 px-3 py-1 border rounded"
							>
								<option value={4}>4</option>
								<option value={6}>6</option>
								<option value={8}>8</option>
							</select>
						</label>
						<button
							onClick={handlePrint}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Print
						</button>
					</div>
				</div>

				<div className={`p-6 tickets-per-page-${ticketsPerPage}`}>
					{tickets.map((ticket) => (
						<div key={ticket.id} className="print-ticket">
							<div className="text-center border-2 border-gray-300 p-4">
								<h3 className="text-lg font-bold mb-2">VBS 2025</h3>
								<p className="text-sm mb-1">
									<strong>Name:</strong> {ticket.customer.fullName}
								</p>
								<p className="text-sm mb-1">
									<strong>Code:</strong> {ticket.code}
								</p>
								<p className="text-sm mb-2">
									<strong>Status:</strong> {ticket.status}
								</p>
								{qrCodes[ticket.code] && (
									<img
										src={qrCodes[ticket.code]}
										alt="QR Code"
										className="mx-auto w-20 h-20"
									/>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

