import { useEffect, useMemo, useRef, useState } from "react";
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

	async function loadLogs() {
		try {
			const res = await api("/api/admin/verify/logs", "GET", undefined, adminKey);
			setLogs(res?.data || []);
		} catch (e) {
			// ignore silently
		}
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
	const [importFile, setImportFile] = useState(null);
	const [importing, setImporting] = useState(false);
	const [importResults, setImportResults] = useState(null);
	const [showVerify, setShowVerify] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [verifyMsg, setVerifyMsg] = useState("");
	const [verifyStatus, setVerifyStatus] = useState("");
	const [manualTicketId, setManualTicketId] = useState("");
	const [logs, setLogs] = useState([]);

	const videoRef = useRef(null);
	const streamRef = useRef(null);
	const scanTimerRef = useRef(null);

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
			if (showVerify) loadLogs();
		}
	}, [adminKey, showVerify]);

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

	async function handleExportTemplate() {
		try {
			const res = await fetch(`${API}/api/admin/manual-template`, {
				method: "GET",
				headers: { "x-admin-key": adminKey || "" },
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || "Export failed");
			}
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "manual-ticket-template.xlsx";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (e) {
			alert(e.message || "Export failed");
		}
	}

	async function handleImport(e) {
		e.preventDefault();
		if (!importFile) return;
		setImporting(true);
		setImportResults(null);
		try {
			const fd = new FormData();
			fd.append("file", importFile);
			const res = await fetch(`${API}/api/admin/manual-import`, {
				method: "POST",
				headers: { "x-admin-key": adminKey || "" },
				body: fd,
			});
			const json = await res.json().catch(() => undefined);
			if (!res.ok) {
				throw new Error(json?.error || "Import failed");
			}
			setImportResults(json);
			await refresh();
		} catch (e) {
			setError(e.message || "Import failed");
		} finally {
			setImporting(false);
		}
	}

	async function startScan() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			streamRef.current = stream;
			videoRef.current.srcObject = stream;
			videoRef.current.play();
			scanTimerRef.current = setInterval(() => {
				// TO DO: implement QR code scanning logic here
			}, 1000);
		} catch (e) {
			console.error("Failed to start scan:", e);
		}
	}

	function stopScan() {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (scanTimerRef.current) {
			clearInterval(scanTimerRef.current);
			scanTimerRef.current = null;
		}
	}

	async function handleVerify(ticketId) {
		try {
			setVerifying(true);
			const res = await api(`/api/admin/verify/${ticketId}`, "GET", undefined, adminKey);
			setVerifyMsg(`Ticket ${ticketId} is ${res?.verified ? "verified" : "not verified"}`);
			setVerifyStatus(res?.verified ? "verified" : "not verified");
		} catch (e) {
			setVerifyMsg(`Failed to verify ticket ${ticketId}: ${e.message}`);
			setVerifyStatus("not verified");
		} finally {
			setVerifying(false);
		}
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
							<div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, marginBottom: 8 }}>
								<button type="button" onClick={() => setShowVerify(false)}>Manage</button>
								<button type="button" onClick={() => { setShowVerify(true); loadLogs(); }}>Verify Ticket</button>
							</div>

							{showVerify ? (
								<div className="form-wrapper" style={{ maxWidth: 720 }}>
									<h3 style={{ marginTop: 0 }}>Verify Ticket</h3>
									<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
										<video ref={videoRef} style={{ width: "100%", maxHeight: 280, background: "#111", borderRadius: 8 }} muted playsInline />
										<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
											<button type="button" onClick={startScan}>Start Scan</button>
											<button type="button" onClick={stopScan}>Stop</button>
										</div>
										<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
											<input
												type="text"
												placeholder="Enter or paste Ticket Code (e.g., VBS-ABC123)"
												value={manualTicketId}
												onChange={(e) => setManualTicketId(e.target.value)}
												style={{ minWidth: 260 }}
											/>
											<button type="button" disabled={verifying || !manualTicketId} onClick={() => handleVerify(manualTicketId)}>
												{verifying ? "Verifying..." : "Verify"}
											</button>
										</div>
										{verifyMsg ? (
											<div style={{ marginTop: 6, color: verifyStatus === "verified" ? "#86efac" : "#fecaca" }}>{verifyMsg}</div>
										) : null}

										<div style={{ marginTop: 16 }}>
											<h4 style={{ marginTop: 0 }}>Recent Verifications</h4>
											<div style={{ overflowX: "auto" }}>
												<table style={{ width: "100%", borderCollapse: "collapse" }}>
													<thead>
														<tr style={{ textAlign: "left" }}>
															<th style={{ padding: 8 }}>Ticket</th>
															<th style={{ padding: 8 }}>Name</th>
															<th style={{ padding: 8 }}>Phone</th>
															<th style={{ padding: 8 }}>Verified At</th>
															<th style={{ padding: 8 }}>By</th>
														</tr>
													</thead>
													<tbody>
														{logs.map((l, i) => (
															<tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
																<td style={{ padding: 8, fontFamily: "monospace" }}>{l.ticketId}</td>
																<td style={{ padding: 8 }}>{l.name}</td>
																<td style={{ padding: 8 }}>{l.phone}</td>
																<td style={{ padding: 8 }}>{l.verifiedAt ? new Date(l.verifiedAt).toLocaleString() : "—"}</td>
																<td style={{ padding: 8 }}>{l.verifiedBy || "admin"}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									</div>
								</div>
							) : null}
							<div className="form-wrapper" style={{ maxWidth: 520 }}>
								<h3 style={{ marginTop: 0 }}>Bulk Manual Tickets</h3>
								<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
									<button type="button" onClick={handleExportTemplate}>Export Manual Ticket Template</button>
									<form onSubmit={handleImport} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
										<input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
										<button type="submit" disabled={importing || !importFile}>{importing ? "Importing..." : "Import Filled Template"}</button>
									</form>
								</div>
								{importResults ? (
									<div style={{ marginTop: 12 }}>
										<h4 style={{ marginTop: 0 }}>Import Summary</h4>
										<div style={{ overflowX: "auto" }}>
											<table style={{ width: "100%", borderCollapse: "collapse" }}>
												<thead>
													<tr style={{ textAlign: "left" }}>
														<th style={{ padding: 8 }}>Row</th>
														<th style={{ padding: 8 }}>Status</th>
														<th style={{ padding: 8 }}>Ticket Code</th>
														<th style={{ padding: 8 }}>Error</th>
													</tr>
												</thead>
												<tbody>
													{(importResults?.results || []).map((r, idx) => (
														<tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
															<td style={{ padding: 8 }}>{r.row}</td>
															<td style={{ padding: 8 }}>{r.success ? "Success" : "Failed"}</td>
															<td style={{ padding: 8, fontFamily: "monospace" }}>{r.ticketId || "—"}</td>
															<td style={{ padding: 8, color: r.success ? "#a7f3d0" : "#fecaca" }}>{r.error || ""}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								) : null}
							</div>
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
												<th style={{ padding: 8 }}>Secure Code</th>
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
													<td style={{ padding: 8, fontFamily: "monospace" }}>{t.accessCode || "—"}</td>
													<td style={{ padding: 8 }}>{t.status}</td>
													<td style={{ padding: 8 }}>{new Date(t.createdAt).toLocaleString()}</td>
													<td style={{ padding: 8, display: "flex", gap: 8 }}>
														<button
															onClick={() => window.open(`/ticket/${encodeURIComponent(t.ticketId)}`, "_blank")}
														>
															View
														</button>
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

