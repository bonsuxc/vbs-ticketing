import hero from "./assets/hero.png";
import TicketForm from "./TicketForm";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      {/* Hero Section */}
      <div className="hero">
        <img src={hero} alt="VBS Hero" className="hero-img" />
        <h1>Welcome to VBS 2025</h1>
        <p>Powered by OxTech</p>
      </div>

      {/* Ticket Form Section */}
      <TicketForm />
    </div>
  );
}
