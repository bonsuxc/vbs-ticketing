import axios from "axios";

const API_BASE = "https://vbs-ticketing-2.onrender.com/";

export const createTicket = async (ticketData) => {
    try {
        const res = await axios.post(`${API_BASE}/tickets`, ticketData);
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const downloadTicketPDF = async (ticketId) => {
    try {
        const res = await axios.get(`${API_BASE}/ticket-pdf/${ticketId}`, {
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `ticket-${ticketId}.pdf`);
        document.body.appendChild(link);
        link.click();
    } catch (err) {
        console.error(err);
    }
};
