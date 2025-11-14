import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

export default function TicketForm() {
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [phone, setPhone] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [polling, setPolling] = useState(false);

    const ussdTelLink = useMemo(() => "tel:*713*7674%23", []);
    const ussdDisplay = useMemo(() => "*713*7674#", []);
    const dialButtonLabel = useMemo(() => "Dial 7137674#", []);

    useEffect(() => {
        QRCode.toDataURL(ussdTelLink, { margin: 1, scale: 6 })
            .then(setQrDataUrl)
            .catch(() => setQrDataUrl(""));
    }, [ussdTelLink]);

    async function lookupByPhone(e) {
        e?.preventDefault?.();
        setResults([]);
        setMessage("");
        const p = String(phone || "").trim();
        if (!p) {
            setMessage("Enter your phone number to find your tickets");
            return;
        }
        try {
            setLoading(true);
            const base = (typeof window !== "undefined" && (import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || window.location.origin)) || "";
            const res = await fetch(`${base}/api/tickets/by-phone/${encodeURIComponent(p)}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Lookup failed");
            setResults(json?.data || []);
            if (!json?.data?.length) {
                setMessage("Waiting for payment confirmation... we'll auto-refresh for up to 60s.");
                // start short polling up to 60s
                startPolling(p);
            }
        } catch (err) {
            setMessage(err.message || "Lookup failed");
        } finally {
            setLoading(false);
        }
    }

    async function startPolling(p) {
        let attempts = 0;
        if (polling) return;
        setPolling(true);
        const base = (typeof window !== "undefined" && (import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || window.location.origin)) || "";
        const timer = setInterval(async () => {
            attempts += 1;
            try {
                const res = await fetch(`${base}/api/tickets/by-phone/${encodeURIComponent(p)}`);
                const json = await res.json();
                if (json?.data?.length) {
                    clearInterval(timer);
                    setResults(json.data);
                    setMessage("");
                    setPolling(false);
                } else if (attempts >= 12) {
                    clearInterval(timer);
                    setMessage("No tickets found yet. If you just paid, please try again shortly.");
                    setPolling(false);
                }
            } catch {
                // ignore transient errors
            }
        }, 5000);
    }

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
                    After paying GHS 300 or above, enter your phone below to view your ticket(s).
                </small>
            </div>

            <form className="ticket-form" onSubmit={lookupByPhone} style={{ marginTop: 16 }}>
                <input
                    type="text"
                    placeholder="Enter Phone Number (e.g. 233245905500)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>{loading ? "Checking..." : "Find My Tickets"}</button>
                {message ? <small style={{ color: "#e2e8f0" }}>{message}</small> : null}
            </form>

            {results && results.length ? (
                <div className="form-wrapper" style={{ marginTop: 16 }}>
                    <h3 style={{ marginTop: 0 }}>Your Tickets</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left" }}>
                                    <th style={{ padding: 8 }}>Type</th>
                                    <th style={{ padding: 8 }}>Amount</th>
                                    <th style={{ padding: 8 }}>Status</th>
                                    <th style={{ padding: 8 }}>Ticket Code</th>
                                    <th style={{ padding: 8 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((t) => (
                                    <tr key={t.ticketId} style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                                        <td style={{ padding: 8 }}>{t.ticketType}</td>
                                        <td style={{ padding: 8 }}>₵{t.amount}</td>
                                        <td style={{ padding: 8 }}>{t.status}</td>
                                        <td style={{ padding: 8, fontFamily: "monospace" }}>{t.ticketId}</td>
                                        <td style={{ padding: 8 }}>
                                            <button type="button" onClick={() => window.open(`/ticket/${encodeURIComponent(t.ticketId)}`, "_blank")}>View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
