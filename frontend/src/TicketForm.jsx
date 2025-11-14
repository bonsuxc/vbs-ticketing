import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

export default function TicketForm() {
    const [qrDataUrl, setQrDataUrl] = useState("");

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

    // No submission; tickets are issued automatically when Hubtel notifies our webhook

    return (
        <div className="ticket-form">
            <div className="qr-section">
                <p className="qr-label">Scan to Pay Instantly</p>
                {qrDataUrl ? (
                    <img className="qr-image" src={qrDataUrl} alt={`Scan to dial ${ussdDisplay} to pay`} />
                ) : null}
                <a className="dial-link" href={ussdTelLink}>
                    {dialButtonLabel}
                </a>
                <small style={{ color: "#e2e8f0", textAlign: "center" }}>
                    After successful payment, your ticket will be created automatically. Use "View Ticket" to see your pass.
                </small>
            </div>
        </div>
    );
}
