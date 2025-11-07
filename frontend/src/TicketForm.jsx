import { useState } from "react";
import axios from "axios";

const API_BASE = "https://vbs-ticketing-2.onrender.com/"; // replace with your Render backend URL

export default function TicketForm() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1️⃣ Create ticket via backend
            const res = await axios.post(`${API_BASE}/api/verify-payment`, {
                reference: "manual_payment", // if using Hubtel, replace with actual reference
                // or if you just want to create free tickets, backend can handle it
                name,
                phone,
                amount: 300
            });

            const ticketId = res.data.data._id;

            // 2️⃣ Download the PDF ticket automatically
            const pdfRes = await axios.get(`${API_BASE}/ticket-pdf/${ticketId}`, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([pdfRes.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `ticket-${ticketId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            alert("Ticket created and downloaded successfully!");
            setName("");
            setPhone("");
        } catch (err) {
            console.error(err);
            alert("Failed to create ticket or download PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
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
            <button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Get Ticket"}
            </button>
        </form>
    );
}
