import axios from "axios";

const API_BASE =
	typeof window !== "undefined"
		? (import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE.replace(/\/$/, "") : "")
		: "";

const buildUrl = (path) => `${API_BASE}${path}`;

export const verifyPayment = async (payload) => {
	try {
		const res = await axios.post(buildUrl("/api/verify-payment"), payload);
		return res.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const downloadTicketPDF = async (ticketId) => {
	try {
		const res = await axios.get(buildUrl(`/ticket-pdf/${ticketId}`), {
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

export const fetchTicketByCode = async (ticketCode) => {
	try {
		const res = await axios.get(buildUrl(`/api/tickets/${ticketCode}`));
		return res.data?.data;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

export const lookupTicket = async ({ phone, accessCode }) => {
    try {
        const res = await axios.post(buildUrl(`/api/tickets/lookup`), { phone, accessCode });
        return res.data?.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
};
