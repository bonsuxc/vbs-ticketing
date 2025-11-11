import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API =
	typeof window !== "undefined"
		? import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || window.location.origin
		: "";
const ADMIN_KEY_STORAGE = "vbs_admin_key";

async function api(path, method = "GET", body, adminKey) {
	const res = await fetch(`${API}${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			"x-admin-key": adminKey || "",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await res.text();
	let parsed;
	try {
		parsed = text ? JSON.parse(text) : undefined;
	} catch {
		parsed = undefined;
	}
	if (!res.ok) {
		let message = parsed?.error || parsed?.message || text || "Request failed";
		const error = new Error(message);
		error.status = res.status;
		error.payload = parsed;
		throw error;
	}
	return parsed;
}

export default function Admin() {
	const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) || "");
	const [keyInput, setKeyInput] = useState("");
	const [tickets, setTickets] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [ticketType, setTicketType] = useState("Regular");
	const [paymentStatus, setPaymentStatus] = useState("Paid");

	const amount = useMemo(() => {
		if (ticketType === "VIP") return 500;
		return 300;
	}, [ticketType]);

	useEffect(() => {
		if (adminKey) {
			localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
			refresh();
		}
	}, [adminKey]);

	async function refresh() {
		try {
			setLoading(true);
			const data = await api("/api/admin/payments", "GET", undefined, adminKey);
			setTickets(data?.data || []);
			setError("");
		} catch (e) {
			if (e.status === 401) {
				localStorage.removeItem(ADMIN_KEY_STORAGE);
				setAdminKey("");
				setError("Admin key required. Please sign in again.");
			} else {
				console.warn("Failed to load ticket list:", e);
				setError(e.message || "Failed to load tickets.");
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleLogin(e) {
		e.preventDefault();
		if (!keyInput) return;
		setAdminKey(keyInput.trim());
		setKeyInput("");
	}

	async function handleCreate(e) {
		e.preventDefault();
		setError("");
		try {
			setLoading(true);
			await api(
				"/api/admin/create",
				"POST",
				{ name, phone, amount, status: paymentStatus, ticketType },
				adminKey
			);
			setName("");
			setPhone("");
			await refresh();
			alert("Ticket created successfully!");
		} catch (e) {
			if (e.status === 401) {
				localStorage.removeItem(ADMIN_KEY_STORAGE);
				setAdminKey("");
				setError("Session expired. Please sign in again.");
			} else {
				setError(e.message || "Create failed");
			}
		} finally {
			setLoading(false);
		}
	}

	async function handleDelete(id) {
		if (!confirm("Delete this ticket?")) return;
		try {
			await api(`/api/admin/payments/${id}`, "DELETE", undefined, adminKey);
			await refresh();
		} catch (e) {
			if (e.status === 401) {
				localStorage.removeItem(ADMIN_KEY_STORAGE);
				setAdminKey("");
				setError("Session expired. Please sign in again.");
			} else {
				alert(e.message || "Delete failed");
			}
		}
	}

	function handleLogout() {
		localStorage.removeItem(ADMIN_KEY_STORAGE);
		setAdminKey("");
		setTickets([]);
		setError("");
	}

	return (
		<div className="app" style={{ background: "#0b1220", color: "#e2e8f0" }}>
			<div className="hero" style={{ minHeight: "100vh", background: "none" }}>
				<div className="hero-content" style={{ color: "#e2e8f0" }}>
					<h1 className="title">Admin Panel</h1>
					<p className="subtitle">Manage tickets privately</p>
					{error ? <small style={{ color: "#fecaca" }}>{error}</small> : null}

					{!adminKey ? (
						<div className="form-wrapper" style={{ maxWidth: 420 }}>
							<form className="ticket-form" onSubmit={handleLogin}>
								<input
									type="password"
									placeholder="Enter admin key"
									value={keyInput}
									onChange={(e) => setKeyInput(e.target.value)}
								/>
								<button type="submit">Sign In</button>
							</form>
						</div>
					) : (
						<>
							<button className="sign-out-button" type="button" onClick={handleLogout}>
								Sign out
							</button>
							<div className="form-wrapper" style={{ maxWidth: 520 }}>
								<h3 style={{ marginTop: 0 }}>Create Manual Ticket</h3>
								<form className="ticket-form" onSubmit={handleCreate}>
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
									<select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
										<option>Regular</option>
										<option>VIP</option>
									</select>
									<select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
										<option>Paid</option>
										<option>Unpaid</option>
									</select>
									<input type="number" value={amount} readOnly />
									<button type="submit" disabled={loading}>
										{loading ? "Processing..." : "Generate Ticket"}
									</button>
									{error ? <small style={{ color: "#fecaca" }}>{error}</small> : null}
								</form>
							</div>

							<div className="form-wrapper" style={{ width: "100%", maxWidth: 920 }}>
								<h3 style={{ marginTop: 0 }}>All Tickets</h3>
								<div style={{ overflowX: "auto" }}>
									<table style={{ width: "100%", borderCollapse: "collapse" }}>
										<thead>
											<tr style={{ textAlign: "left" }}>
												<th style={{ padding: 8 }}>Name</th>
												<th style={{ padding: 8 }}>Phone</th>
												<th style={{ padding: 8 }}>Ticket Type</th>
												<th style={{ padding: 8 }}>Amount</th>
												<th style={{ padding: 8 }}>Ticket Code</th>
												<th style={{ padding: 8 }}>Status</th>
												<th style={{ padding: 8 }}>Created</th>
												<th style={{ padding: 8 }}></th>
											</tr>
										</thead>
										<tbody>
											{tickets.map((t) => (
												<tr key={t._id} style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
													<td style={{ padding: 8 }}>{t.name}</td>
													<td style={{ padding: 8 }}>{t.phone}</td>
													<td style={{ padding: 8 }}>{t.ticketType}</td>
													<td style={{ padding: 8 }}>₵{t.amount}</td>
													<td style={{ padding: 8, fontFamily: "monospace" }}>{t.ticketId}</td>
													<td style={{ padding: 8 }}>{t.status}</td>
													<td style={{ padding: 8 }}>{new Date(t.createdAt).toLocaleString()}</td>
													<td style={{ padding: 8 }}>
														<button
															style={{ background: "#ef4444" }}
															onClick={() => handleDelete(t._id)}
														>
															Delete
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

