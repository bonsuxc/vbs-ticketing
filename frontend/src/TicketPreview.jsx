import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import hero from "./assets/hero.png";
import { fetchTicketByCode, downloadTicketPDF } from "./api";
import "./App.css";
import { useLocation, useParams } from "react-router-dom";

export default function TicketPreview() {
	const { ticketId = "" } = useParams();
	const ticketCode = useMemo(() => decodeURIComponent(ticketId || ""), [ticketId]);
	const [ticket, setTicket] = useState(null);
	const [qrImage, setQrImage] = useState("");
	const [status, setStatus] = useState({ loading: true, error: "" });
	const [downloading, setDownloading] = useState(false);
    const location = useLocation();
    const params = new URLSearchParams(location.search || "");
    const fromVerify = params.get("verified") === "1";
    const wasUsed = params.get("used") === "1";
    const invalid = params.get("invalid") === "1";

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
					) : status.error || invalid || wasUsed ? (
						<div className="ticket-card ticket-card--error">
							<h2>Invalid Ticket or Already Verified</h2>
							<p>{status.error || "❌ Invalid Ticket or Already Verified."}</p>
						</div>
					) : (
						<div className="ticket-card">
							<div className="ticket-card-header">
								<span className="ticket-season">Digital Pass</span>
								<h1 className="ticket-title">Vacation Bible School 2025 (VBS)</h1>
								<p className="ticket-subtitle">ICS Pakyi No. 2</p>
								{fromVerify ? (
									<p style={{ marginTop: 8, color: "#a7f3d0", display: "flex", alignItems: "center", gap: 8 }}>
										<span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 999, background: "#22c55e", textAlign: "center", lineHeight: "18px" }}>✓</span>
										<span>Ticket Verified Successfully</span>
									</p>
								) : null}
							</div>

							<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
								<div className="ticket-grid" style={{ flex: 1, minWidth: 260 }}>
									<InfoRow label="Event" value="Vacation Bible School 2025 (VBS)" />
									<InfoRow label="Venue" value="ICS Pakyi No. 2" />
									<InfoRow label="Event Date" value={`${ticket?.eventDate || "27th December 2025"} · ${ticket?.eventTime || "09:00 AM"}`} />
									<InfoRow label="Full Name" value={ticket?.name} />
									<InfoRow label="Phone Number" value={ticket?.phone} />
									<InfoRow label="Ticket Type" value={ticket?.ticketType} />
									<InfoRow label="Ticket ID" value={ticket?.ticketId} />
									<InfoRow label="Status" value={ticket?.status || "—"} />
									<InfoRow label="Amount" value={ticket?.amount ? `₵${Number(ticket.amount).toFixed(2)}` : "—"} />
									<InfoRow label="Issued On" value={ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"} />
									{/* Hide secure code on verification view */}
									{fromVerify ? null : <InfoRow label="Secure Code" value={ticket?.accessCode} />}
								</div>
								<div className="ticket-qr-section" style={{ minWidth: 200, flex: "0 0 200px", marginTop: 0 }}>
									<div className="ticket-qr-box">
										{qrImage ? (
											<img src={qrImage} alt={`QR code for ${ticket?.ticketId}`} />
										) : (
											<span className="ticket-qr-fallback">QR unavailable</span>
										)}
									</div>
									<p className="ticket-qr-hint">Scan to verify your ticket instantly</p>
								</div>
							</div>

							{fromVerify ? null : (
								<button
									className="ticket-download-button"
									onClick={handleDownloadPDF}
									disabled={downloading || !ticket?.id}
								>
									{downloading ? "Downloading..." : "Download Ticket (PDF)"}
								</button>
							)}
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

