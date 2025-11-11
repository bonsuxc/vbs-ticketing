import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import hero from "./assets/hero.png";
import { fetchTicketByCode, downloadTicketPDF } from "./api";
import "./App.css";
import { useParams } from "react-router-dom";

export default function TicketPreview() {
	const { ticketId = "" } = useParams();
	const ticketCode = useMemo(() => decodeURIComponent(ticketId || ""), [ticketId]);
	const [ticket, setTicket] = useState(null);
	const [qrImage, setQrImage] = useState("");
	const [status, setStatus] = useState({ loading: true, error: "" });
	const [downloading, setDownloading] = useState(false);

	useEffect(() => {
		async function loadTicket() {
			if (!ticketCode) {
				setStatus({ loading: false, error: "Ticket reference missing." });
				return;
			}
			try {
				const data = await fetchTicketByCode(ticketCode);
				setTicket(data);
				setStatus({ loading: false, error: "" });
			} catch (err) {
				console.error(err);
				setStatus({
					loading: false,
					error: "We could not find that ticket. Please check your link or contact support.",
				});
			}
		}
		loadTicket();
	}, [ticketCode]);

	useEffect(() => {
		if (!ticket) return;
		const origin = typeof window !== "undefined" ? window.location.origin : "";
		const verifyUrl = `${origin}/api/tickets/${encodeURIComponent(ticket.ticketId)}/verify`;
		QRCode.toDataURL(verifyUrl, { margin: 1, scale: 7 })
			.then(setQrImage)
			.catch((err) => {
				console.error(err);
				setQrImage("");
			});
	}, [ticket]);

	const InfoRow = ({ label, value }) => (
		<div className="ticket-field">
			<span className="ticket-label">{label}</span>
			<span className="ticket-value">{value || "—"}</span>
		</div>
	);

	const handleDownloadPDF = async () => {
		if (!ticket?.id) return;
		setDownloading(true);
		try {
			await downloadTicketPDF(ticket.id);
		} catch (err) {
			console.error("Failed to download PDF:", err);
			alert("Failed to download ticket PDF. Please try again.");
		} finally {
			setDownloading(false);
		}
	};

	return (
		<div className="ticket-preview-page" style={{ backgroundImage: `url(${hero})` }}>
			<div className="ticket-preview-overlay">
				<div className="ticket-preview-container">
					{status.loading ? (
						<div className="ticket-card ticket-card--loading">
							<p>Loading ticket...</p>
						</div>
					) : status.error ? (
						<div className="ticket-card ticket-card--error">
							<h2>Ticket Not Found</h2>
							<p>{status.error}</p>
						</div>
					) : (
						<div className="ticket-card">
							<div className="ticket-card-header">
								<span className="ticket-season">Digital Pass</span>
								<h1 className="ticket-title">VBS 2025</h1>
								<p className="ticket-subtitle">Vacation Bible School Experience</p>
							</div>

							<div className="ticket-grid">
								<InfoRow label="Full Name" value={ticket?.name} />
								<InfoRow label="Phone Number" value={ticket?.phone} />
								<InfoRow label="Ticket Type" value={ticket?.ticketType} />
								<InfoRow label="Ticket Code" value={ticket?.ticketId} />
								<InfoRow
									label="Amount"
									value={ticket?.amount ? `₵${Number(ticket.amount).toFixed(2)}` : "—"}
								/>
								<InfoRow
									label="Event Date"
									value={`${ticket?.eventDate || "Dec 15, 2025"} · ${ticket?.eventTime || "09:00 AM"}`}
								/>
								<InfoRow
									label="Issued On"
									value={ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"}
								/>
								<InfoRow label="Status" value={ticket?.status || "—"} />
							</div>

							<div className="ticket-qr-section">
								<div className="ticket-qr-box">
									{qrImage ? (
										<img src={qrImage} alt={`QR code for ${ticket?.ticketId}`} />
									) : (
										<span className="ticket-qr-fallback">QR unavailable</span>
									)}
								</div>
								<p className="ticket-qr-hint">Scan to verify your ticket instantly</p>
							</div>

							<button
								className="ticket-download-button"
								onClick={handleDownloadPDF}
								disabled={downloading || !ticket?.id}
							>
								{downloading ? "Downloading..." : "Download Ticket (PDF)"}
							</button>
						</div>
					)}
				</div>
			</div>

			<footer className="footer">
				<p>Powered by OxTech</p>
			</footer>
		</div>
	);
}

