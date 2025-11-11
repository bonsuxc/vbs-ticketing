import { useState } from "react";
import hero from "./assets/hero.png";
import TicketForm from "./TicketForm";
import ViewTicket from "./ViewTicket";
import "./App.css";

export default function TicketsPortal() {
  const [mode, setMode] = useState("none"); // none | generate | view

  return (
    <div className="ticket-preview-page" style={{ backgroundImage: `url(${hero})` }}>
      <div className="ticket-preview-overlay">
        <div className="ticket-preview-container">
          <div className="ticket-card" style={{ maxWidth: 900, width: "100%" }}>
            <div className="ticket-card-header">
              <span className="ticket-season">Tickets Portal</span>
              <h1 className="ticket-title">VBS 2025</h1>
              <p className="ticket-subtitle">Select what you want to do</p>
            </div>

            {mode === "none" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                <button className="portal-card" onClick={() => setMode("generate")}>Generate Ticket</button>
                <button className="portal-card" onClick={() => setMode("view")}>View Ticket</button>
              </div>
            )}

            {mode === "generate" && (
              <div>
                <h3 style={{ marginTop: 16, marginBottom: 8 }}>Automatic Ticket Generation</h3>
                <TicketForm />
                <button className="sign-out-button" type="button" onClick={() => setMode("none")} style={{ marginTop: 12 }}>Back</button>
              </div>
            )}

            {mode === "view" && (
              <div>
                <h3 style={{ marginTop: 16, marginBottom: 8 }}>View Manual Ticket</h3>
                <ViewTicket />
                <button className="sign-out-button" type="button" onClick={() => setMode("none")} style={{ marginTop: 12 }}>Back</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>Powered by OxTech</p>
      </footer>
    </div>
  );
}
