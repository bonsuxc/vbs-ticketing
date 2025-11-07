// client/src/pages/Home.jsx
import { useState } from "react";
import API from "../api";

export default function Home() {
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");

    const handleVerify = async () => {
        try {
            const res = await API.post("/payment/verify", { phoneNumber: phone });
            setMessage(res.data.message || "Check your ticket page");
        } catch (err) {
            setMessage(err.response?.data?.message || "Verification failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="relative">
                {/* hero image served from client/public/hero.jpg */}
                <img src="/hero.jpg" alt="VBS Hero" className="w-full h-64 object-cover" />
                <div className="absolute inset-0 flex items-end">
                    <div className="bg-black/40 text-white p-6 w-full">
                        <h1 className="text-3xl font-bold">VBS 2025 - Grace Baptist Teens Chapel</h1>
                        <p className="mt-1">Secure your ticket quickly using our payment system.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-6">
                <div className="bg-white p-6 rounded shadow">
                    <label className="block mb-2 text-sm font-medium">Phone number (used for payment)</label>
                    <input
                        className="w-full border p-2 rounded mb-4"
                        placeholder="024xxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button onClick={handleVerify} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                        Find / Claim Ticket
                    </button>

                    {message && <p className="mt-4 text-center">{message}</p>}
                </div>

                <footer className="mt-8 text-center text-sm text-gray-600">
                    <p>Powered by <strong>OxTech</strong></p>
                </footer>
            </main>
        </div>
    );
}
