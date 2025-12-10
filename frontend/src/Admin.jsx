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
	const [importFile, setImportFile] = useState(null);
	const [importing, setImporting] = useState(false);
	const [importResults, setImportResults] = useState(null);

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [ticketType, setTicketType] = useState("Regular");
	const [paymentStatus, setPaymentStatus] = useState("Paid");
	const [ticketCount, setTicketCount] = useState(1);

	const [activeTab, setActiveTab] = useState("manage");
	const [verifyCode, setVerifyCode] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [verifyResult, setVerifyResult] = useState("");
	const [lastAutoVerifiedCode, setLastAutoVerifiedCode] = useState("");
	const [logs, setLogs] = useState([]);
	const [resolveRef, setResolveRef] = useState("");
	const [resolvePhone, setResolvePhone] = useState("");
	const [resolveName, setResolveName] = useState("");
	const [resolving, setResolving] = useState(false);
	const [resolveResult, setResolveResult] = useState(null);

	// QR scanning state
	const [scanOpen, setScanOpen] = useState(false);
	const [scanError, setScanError] = useState("");
	const [streamRef, setStreamRef] = useState(null);
	const [videoTrack, setVideoTrack] = useState(null);
	const [torchOn, setTorchOn] = useState(false);
	const videoId = "qr_video_el";

	const amount = useMemo(() => {
		if (ticketType === "VIP") return 500;
		return 300;
	}, [ticketType]);

	useEffect(() => {
		if (adminKey) {
			localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
			refresh();
			if (activeTab === "verify") {
				loadLogs();
			}
		}
	}, [adminKey, activeTab]);

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

	async function handleResolveTxn(e) {
		e.preventDefault();
		setError("");
		setResolveResult(null);
		if (!resolveRef || !resolvePhone) {
			setError("Client reference and phone are required");
			return;
		}
		try {
			setResolving(true);
			const body = {
				clientReference: resolveRef.trim(),
				phone: resolvePhone.trim(),
				name: resolveName.trim() || undefined,
			};
			const res = await api("/api/admin/resolve-txn", "POST", body, adminKey);
			setResolveResult(res || {});
			await refresh();
		} catch (e) {
			if (e.status === 401) {
				localStorage.removeItem(ADMIN_KEY_STORAGE);
				setAdminKey("");
				setError("Session expired. Please sign in again.");
			} else {
				setError(e.message || "Resolve failed");
			}
		} finally {
			setResolving(false);
		}
	}

	async function loadLogs() {
		try {
			const data = await api("/api/admin/verify/logs", "GET", undefined, adminKey);
			setLogs(data?.data || []);
		} catch (e) {
			console.warn("Failed to load logs:", e);
		}
	}

	async function handleVerify(e) {
		e?.preventDefault?.();
		if (!verifyCode) return;
		setVerifying(true);
		setVerifyResult("");
		try {
			const res = await api("/api/admin/verify", "POST", { ticketId: verifyCode }, adminKey);
			setVerifyResult(res?.status === "verified" ? "Verified — Access Granted" : "Verification completed");
			await loadLogs();
			await refresh();
		} catch (e) {
			if (e.status === 401) {
				localStorage.removeItem(ADMIN_KEY_STORAGE);
				setAdminKey("");
				setError("Session expired. Please sign in again.");
			} else {
				setVerifyResult(e.message || "Invalid or Already Used");
			}
		} finally {
			setVerifying(false);
		}
	}

	// Auto-verify when a full ticket code is present (e.g. from scan or paste),
	// so the admin does not have to press the Verify button explicitly.
	useEffect(() => {
		if (!verifyCode || verifying) return;
		const cleaned = verifyCode.trim().toUpperCase();
		// Basic pattern: VBS- + at least 4 more alphanumeric chars
		if (!/^VBS-[A-Z0-9]{4,}$/.test(cleaned)) return;
		if (cleaned === lastAutoVerifiedCode) return;
		setLastAutoVerifiedCode(cleaned);
		// Fire verify without requiring button press
		// eslint-disable-next-line no-floating-promises
		handleVerify();
	}, [verifyCode, verifying, lastAutoVerifiedCode]);

	function extractTicketIdFromText(text) {
		if (!text) return "";
		try {
			const url = new URL(text);
			const parts = url.pathname.split("/").filter(Boolean);
			const idx = parts.findIndex((p) => p.toLowerCase() === "tickets" || p.toLowerCase() === "ticket");
			if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
		} catch {}
		const m = String(text).match(/VBS-[A-Z0-9]{6,}/i);
		return m ? m[0].toUpperCase() : "";
	}

	async function startScan() {
		setScanError("");
		setScanOpen(true);
		try {
			const constraints = { video: { facingMode: { ideal: "environment" } } };
			// Try native BarcodeDetector first
			if ("BarcodeDetector" in window) {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				setStreamRef(stream);
				const track = stream.getVideoTracks()[0];
				setVideoTrack(track || null);
				const video = document.getElementById(videoId);
				if (video) {
					video.srcObject = stream;
					video.play().catch(() => {});
				}
				const detector = new window.BarcodeDetector({ formats: ["qr_code", "qr", "code_128", "pdf417"] });
				let cancelled = false;
				async function loop() {
					if (cancelled) return;
					try {
						const v = document.getElementById(videoId);
						if (v && v.readyState >= 2) {
							const codes = await detector.detect(v);
							if (codes && codes.length) {
								const raw = codes[0].rawValue || codes[0].raw || "";
								const tid = extractTicketIdFromText(raw);
								if (tid) {
									setVerifyCode(tid);
									await handleVerify();
									cancelled = true;
									stopScan();
									return;
								}
							}
						}
					} catch (e) {
						setScanError(e?.message || "Scan error");
					}
					if (!cancelled) requestAnimationFrame(loop);
				}
				requestAnimationFrame(loop);
				return;
			}

			// Fallback to ZXing for Safari/iOS and other browsers
			try {
				const { BrowserMultiFormatReader } = await import("@zxing/browser");
				const codeReader = new BrowserMultiFormatReader();
				const video = document.getElementById(videoId);
				if (!video) throw new Error("Video element not found");
				await codeReader.decodeFromVideoDevice(undefined, video, (result, err, controls) => {
					if (result?.getText) {
						const raw = result.getText();
						const tid = extractTicketIdFromText(raw);
						if (tid) {
							setVerifyCode(tid);
							controls.stop();
							stopScan();
							// Fire verify after close so UI updates cleanly
							setTimeout(() => handleVerify(), 0);
						}
					}
					if (err && String(err).includes("NotFoundException")) {
						// keep scanning silently
					}
				});
			} catch (e) {
				setScanError("QR scanning not supported on this device/browser. Please enter the code manually.");
			}
		} catch (e) {
			setScanError(e?.message || "Unable to start camera");
		}
	}

	function stopScan() {
		try {
			const video = document.getElementById(videoId);
			if (video) video.srcObject = null;
			if (streamRef) {
				streamRef.getTracks().forEach((t) => t.stop());
				setStreamRef(null);
			}
			if (videoTrack) {
				try {
					videoTrack.stop();
				} catch {}
				setVideoTrack(null);
				setTorchOn(false);
			}
		} catch {}
		setScanOpen(false);
	}

	async function toggleFlash() {
		try {
			if (!videoTrack || !videoTrack.getCapabilities) return;
			const capabilities = videoTrack.getCapabilities();
			if (!capabilities || !capabilities.torch) {
				setScanError("Flashlight not supported on this device");
				return;
			}
			const next = !torchOn;
			await videoTrack.applyConstraints({ advanced: [{ torch: next }] });
			setTorchOn(next);
		} catch (e) {
			setScanError(e?.message || "Unable to toggle flashlight");
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
			// Validate input
			if (!name || !phone) {
				setError("Name and phone are required");
				return;
			}

			const count = Math.max(1, Math.min(50, parseInt(ticketCount) || 1));
			if (count > 50) {
				setError("Maximum 50 tickets at once");
				return;
			}

			setLoading(true);

			// Create an array of ticket creation promises
			const createPromises = Array(count).fill().map(() => 
				api(
					"/api/admin/create",
					"POST",
					{ name, phone, amount, status: paymentStatus, ticketType },
					adminKey
				)
			);

			// Wait for all tickets to be created
			const results = await Promise.all(createPromises);

			// Reset form and show success message
			setName("");
			setPhone("");
			setTicketCount(1);
			await refresh();
			alert(`Successfully created ${results.length} ticket${results.length !== 1 ? 's' : ''}!`);
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
							<div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
								<button onClick={() => setActiveTab("manage")}>Manage</button>
								<button onClick={() => setActiveTab("verify")}>Verify Ticket</button>
							</div>

							{activeTab === "verify" ? (
								<div className="form-wrapper" style={{ maxWidth: 520 }}>
									<h3 style={{ marginTop: 0 }}>Verify Ticket</h3>
									<form className="ticket-form" onSubmit={handleVerify}>
										<input
											type="text"
											placeholder="Enter Ticket Code (e.g. VBS-XXXXXX)"
											value={verifyCode}
											onChange={(e) => setVerifyCode(e.target.value)}
											required
										/>
										<button type="submit" disabled={verifying}>{verifying ? "Verifying..." : "Verify"}</button>
										<button type="button" onClick={startScan} disabled={verifying}>Scan QR</button>
										{verifyResult ? (
											<p style={{ marginTop: 8, color: verifyResult.includes("Verified") ? "#a7f3d0" : "#fecaca" }}>
												{verifyResult}
											</p>
										) : null}
									</form>
									{scanOpen ? (
										<div className="qr-scanner-overlay">
											<video id={videoId} className="qr-scanner-video" playsInline muted />
											<div className="scanner-frame" />
											<div className="scan-hint">Find a code to scan</div>
											<button
												id="flash-btn"
												type="button"
												className={`flash-btn${torchOn ? " flash-btn--active" : ""}`}
												onClick={toggleFlash}
											>
												🔦
											</button>
											<button type="button" className="scanner-close-btn" onClick={stopScan}>
												Close
											</button>
											{scanError ? <p style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "#fecaca", background: "rgba(0,0,0,0.6)", padding: "6px 10px", borderRadius: 999, fontSize: 12, zIndex: 20 }}>{scanError}</p> : null}
										</div>
									) : null}
									<div style={{ marginTop: 16 }}>
										<h4 style={{ marginTop: 0 }}>Recent Verifications</h4>
										<button type="button" onClick={loadLogs} style={{ marginBottom: 8 }}>Refresh Logs</button>
										<div style={{ overflowX: "auto" }}>
											<table style={{ width: "100%", borderCollapse: "collapse" }}>
												<thead>
													<tr style={{ textAlign: "left" }}>
														<th style={{ padding: 8 }}>Ticket Code</th>
														<th style={{ padding: 8 }}>Name</th>
														<th style={{ padding: 8 }}>Phone</th>
														<th style={{ padding: 8 }}>Verified At</th>
														<th style={{ padding: 8 }}>Verified By</th>
													</tr>
												</thead>
												<tbody>
													{logs.map((l, i) => (
														<tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
															<td style={{ padding: 8, fontFamily: "monospace" }}>{l.ticketId}</td>
															<td style={{ padding: 8 }}>{l.name}</td>
															<td style={{ padding: 8 }}>{l.phone}</td>
															<td style={{ padding: 8 }}>{l.verifiedAt ? new Date(l.verifiedAt).toLocaleString() : "—"}</td>
															<td style={{ padding: 8 }}>{l.verifiedBy || "—"}</td>
														</tr>
													))}
												</tbody>
											</table>
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
								<h3 style={{ marginTop: 0 }}>Resolve Transaction (Status Check)</h3>
								<form className="ticket-form" onSubmit={handleResolveTxn}>
									<input
										type="text"
										placeholder="Client Reference from Hubtel"
										value={resolveRef}
										onChange={(e) => setResolveRef(e.target.value)}
										required
									/>
									<input
										type="text"
										placeholder="Customer Phone (e.g. 233549111198)"
										value={resolvePhone}
										onChange={(e) => setResolvePhone(e.target.value)}
										required
									/>
									<input
										type="text"
										placeholder="Customer Name (optional)"
										value={resolveName}
										onChange={(e) => setResolveName(e.target.value)}
									/>
									<button type="submit" disabled={resolving}>{resolving ? "Resolving..." : "Resolve & Issue Tickets"}</button>
									{resolveResult ? (
										<small style={{ color: "#e2e8f0" }}>
											Status: {resolveResult.status || "Unknown"}; Resolved: {String(resolveResult.resolved)}; Created: {resolveResult.created || 0}
										</small>
									) : null}
								</form>
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
									<div style={{ display: 'flex', gap: '8px', width: '100%' }}>
										<input
											type="number"
											min="1"
											max="50"
											value={ticketCount}
											onChange={(e) => setTicketCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
											style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #4a5568' }}
										/>
										<span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>tickets</span>
									</div>
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

