import hero from "./assets/hero.png";
import TicketForm from "./TicketForm";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <section className="hero" style={{ backgroundImage: `url(${hero})` }}>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="title">Welcome to VBS 2025</h1>
            <p className="subtitle">Join us for an unforgettable experience</p>
            <div className="form-wrapper">
              <TicketForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>Powered by OxTech</p>
      </footer>
    </div>
  );
}
