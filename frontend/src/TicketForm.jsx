import { useEffect, useMemo, useState } from "react";
import { verifyPayment } from "./api";
import QRCode from "qrcode";

export default function TicketForm() {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [ticketType, setTicketType] = useState("Regular");
	const [loading, setLoading] = useState(false);
	const [qrDataUrl, setQrDataUrl] = useState("");
    const [secureCode, setSecureCode] = useState("");

	const ussdTelLink = useMemo(() => "tel:*713*7674%23", []);
	const ussdDisplay = useMemo(() => "*713*7674#", []);
	const dialButtonLabel = useMemo(() => "Dial 7137674#", []);

	// Generate QR for USSD dial
	// %23 encodes # for USSD compatibility
	useEffect(() => {
		QRCode.toDataURL(ussdTelLink, { margin: 1, scale: 6 })
			.then(setQrDataUrl)
			.catch(() => setQrDataUrl(""));
	}, [ussdTelLink]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			// 1️⃣ Create ticket via backend
			const result = await verifyPayment({
				reference: "manual_payment", // replace with actual reference for production
				name: name.trim(),
				phone: phone.trim(),
				amount: 300,
				ticketType,
			});

			const created = result?.data;
			if (!created) {
				throw new Error("Ticket creation payload missing");
			}

			// Show secure code to the user (for viewing tickets later)
			if (created.accessCode) {
				setSecureCode(String(created.accessCode));
			}

			// 2️⃣ Open ticket preview page
			if (created.ticketId) {
				window.open(`/ticket/${encodeURIComponent(created.ticketId)}`, "_blank");
			}

			alert(
				created.accessCode
					? `Ticket created successfully! Your secure code is ${created.accessCode}. Your preview has opened in a new tab.`
					: "Ticket created successfully! Your preview has opened in a new tab."
			);
			setName("");
			setPhone("");
			setTicketType("Regular");
		} catch (err) {
			console.error(err);
			const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to create ticket or download PDF";
			alert(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<form onSubmit={handleSubmit} className="ticket-form">
				<input
					type="text"
					placeholder="Full Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<input
					type="text"
					placeholder="Phone Number"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					required
				/>
				<select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
					<option value="Regular">Regular</option>
					<option value="VIP">VIP</option>
				</select>
				<button type="submit" disabled={loading}>
					{loading ? "Processing..." : "Get Ticket"}
				</button>
			</form>

			{secureCode ? (
				<div className="notice" style={{ marginTop: 12 }}>
					<strong>Your Secure Access Code:</strong>
					<div style={{ fontFamily: "monospace", fontSize: 18, marginTop: 4 }}>{secureCode}</div>
					<small>Keep this code safe. You will need it with your phone number to view your ticket.</small>
				</div>
			) : null}

			{/* QR Section */}
			<div className="qr-section">
				<p className="qr-label">Scan to Pay Instantly</p>
				{qrDataUrl ? (
					<img className="qr-image" src={qrDataUrl} alt={`Scan to dial ${ussdDisplay} to pay`} />
				) : null}
				<a className="dial-link" href={ussdTelLink}>
					{dialButtonLabel}
				</a>
			</div>
		</div>
	);
}
