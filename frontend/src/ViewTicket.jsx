import { useEffect, useState } from "react";
import { downloadTicketPDF, lookupTicket } from "./api";
import QRCode from "qrcode";
import hero from "./assets/hero.png";
import "./App.css";

export default function ViewTicket() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const handleLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTicket(null);
    try {
      const res = await lookupTicket({ phone, accessCode });
      setTicket(res);
    } catch (err) {
      const msg = err?.response?.data?.error || "Ticket not found";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ticket?.id) return;
    setDownloading(true);
    try {
      await downloadTicketPDF(ticket.id);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    async function makeQR() {
      try {
        if (!ticket?.ticketId) {
          setQrImage("");
          return;
        }
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const verifyUrl = `${origin}/api/tickets/${encodeURIComponent(ticket.ticketId)}/verify`;
        const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 7 });
        setQrImage(dataUrl);
      } catch {
        setQrImage("");
      }
    }
    makeQR();
  }, [ticket]);

  const Info = ({ label, value }) => (
    <div className="ticket-field">
      <span className="ticket-label">{label}</span>
      <span className="ticket-value">{value || "—"}</span>
    </div>
  );

  const ticketType = ticket?.ticketType || "Regular";
  let ticketStatus = (ticket?.status || "Paid").toString();
  if (ticket?.used) {
    ticketStatus = "Used";
  }
  const statusLower = ticketStatus.toLowerCase();
  let statusClass = "ticket-status-pill";
  if (statusLower.includes("paid") || statusLower.includes("success")) statusClass += " ticket-status-pill--paid";
  else if (statusLower.includes("pending")) statusClass += " ticket-status-pill--pending";
  else if (statusLower.includes("cancel") || statusLower.includes("invalid")) statusClass += " ticket-status-pill--cancelled";
  const typeClass = `ticket-type-pill ${ticketType === "VIP" ? "ticket-type-pill--vip" : "ticket-type-pill--regular"}`;

  return (
    <div className="ticket-preview-page" style={{ backgroundImage: `url(${hero})` }}>
      <div className="ticket-preview-overlay">
        <div className="ticket-preview-container">
          <div className="ticket-card" style={{ maxWidth: 640 }}>
            <div className="ticket-card-header">
              <span className="ticket-season">Manual Lookup</span>
              <h1 className="ticket-title">View Your Ticket</h1>
              <p className="ticket-subtitle">Enter your phone number to find your ticket</p>
            </div>

            <form className="ticket-form" onSubmit={handleLookup} style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Access Code (e.g. K4Z8M)"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>{loading ? "Searching..." : "Find Ticket"}</button>
            </form>
            {error ? <small style={{ color: "#fecaca" }}>{error}</small> : null}

            {ticket ? (
              <>
                <div className="ticket-badges-row" style={{ marginBottom: 8 }}>
                  <span className={typeClass}>{ticketType}</span>
                  <span className={statusClass}>
                    <span className="ticket-status-dot" />
                    {ticketStatus}
                  </span>
                </div>
                <div className="ticket-grid">
                  <Info label="Full Name" value={ticket.name} />
                  <Info label="Phone Number" value={ticket.phone} />
                  <Info label="Ticket Type" value={ticket.ticketType} />
                  <Info label="Ticket Code" value={ticket.ticketId} />
                  <Info label="Amount" value={ticket.amount ? `₵${Number(ticket.amount).toFixed(2)}` : "—"} />
                  <Info label="Event Date" value={`${ticket.eventDate || "Dec 27, 2025"} · ${ticket.eventTime || "09:00 AM"}`} />
                  <Info label="Issued On" value={ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "—"} />
                  <Info label="Status" value={ticket.status} />
                </div>

                <div className="ticket-qr-section" style={{ marginTop: 12 }}>
                  <div className="ticket-qr-box">
                    {qrImage ? <img src={qrImage} alt={`QR code for ${ticket.ticketId}`} /> : <span className="ticket-qr-fallback">QR unavailable</span>}
                  </div>
                  <p className="ticket-qr-hint">Scan to verify your ticket instantly</p>
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button onClick={() => window.open(`/ticket/${encodeURIComponent(ticket.ticketId)}`, "_blank")}>Open Ticket Page</button>
                  <button onClick={handleDownload} disabled={downloading || !ticket.id}>
                    {downloading ? "Downloading..." : "Download Ticket (PDF)"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>Powered by OxTech</p>
      </footer>
    </div>
  );
}
