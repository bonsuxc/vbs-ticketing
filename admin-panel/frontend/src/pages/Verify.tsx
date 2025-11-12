import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export function VerifyPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [logs, setLogs] = useState<Array<{ ticketId: string; name: string | null; phone: string | null; verifiedAt: string; verifiedBy: string | null }>>([]);
  const [adminKey, setAdminKey] = useState<string>("");

  async function fetchLogs() {
    try {
      const res = await api.get("/admin/verify/logs", { headers: { "x-admin-key": adminKey } });
      setLogs(res.data?.data ?? []);
    } catch (e: any) {
      // ignore for now
    }
  }

  async function verifyTicketId(ticketId: string) {
    setMessage("Verifying...");
    setStatus("idle");
    try {
      const res = await api.post(
        "/admin/verify",
        { ticketId },
        { headers: { "x-admin-key": adminKey } }
      );
      if (res.data?.ok) {
        setStatus("success");
        setMessage(`✅ Verified — Access Granted (Ticket ${res.data.ticketId})`);
        await fetchLogs();
      } else {
        setStatus("error");
        setMessage("❌ Invalid or Already Used");
      }
    } catch (e: any) {
      const http = e?.response?.status;
      if (http === 404) {
        setStatus("error");
        setMessage("❌ Invalid or Already Used");
      } else if (http === 409) {
        setStatus("error");
        setMessage("❌ Invalid or Already Used");
      } else if (http === 401) {
        setStatus("error");
        setMessage("Unauthorized — check admin key");
      } else {
        setStatus("error");
        setMessage("Verification failed");
      }
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId = 0;
    let detector: any = null as any;

    async function start() {
      try {
        if (!("BarcodeDetector" in window)) return; // fallback to manual input
        detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
          loop();
        }
      } catch {
        // no camera or blocked
      }
    }

    async function loop() {
      try {
        if (!videoRef.current || !detector) return;
        const detections = await detector.detect(videoRef.current);
        if (detections && detections.length > 0) {
          const raw = detections[0]?.rawValue || detections[0]?.rawValue || "";
          // Accept URLs like /api/tickets/{ticketId}/verify or plain ticketId
          const match = raw.match(/tickets\/(VBS-[A-Z0-9]+)/i);
          const ticketId = match ? match[1] : raw.trim();
          if (ticketId && /^VBS-[A-Z0-9]{6}$/i.test(ticketId)) {
            cancelAnimationFrame(rafId);
            setScanning(false);
            await verifyTicketId(ticketId.toUpperCase());
            return;
          }
        }
      } catch {
        // ignore frame errors
      }
      rafId = requestAnimationFrame(loop);
    }

    start();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [adminKey]);

  const [manualId, setManualId] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Verify Ticket</h1>
        <p className="text-sm text-slate-500">Scan the QR code or enter a ticket code manually.</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Admin Key</label>
          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Enter admin key"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="password"
          />

          <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          </div>
          <p className="text-xs text-slate-500">{scanning ? "Scanning..." : "Scanner inactive or not supported. Use manual input below."}</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Manual Ticket Code</label>
          <div className="flex gap-2">
            <input
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. VBS-1A2B3C"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => manualId && verifyTicketId(manualId.trim())}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Verify
            </button>
          </div>

          <div className={status === "success" ? "text-emerald-600" : status === "error" ? "text-rose-600" : "text-slate-600"}>
            {message}
          </div>

          <div className="pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Verifications</h2>
              <button onClick={fetchLogs} className="text-xs text-brand-700 hover:underline">Refresh</button>
            </div>
            <div className="max-h-64 overflow-auto rounded border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ticket</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((r) => (
                    <tr key={`${r.ticketId}-${r.verifiedAt}`}>
                      <td className="px-3 py-2 font-mono">{r.ticketId}</td>
                      <td className="px-3 py-2">{r.name ?? ""}</td>
                      <td className="px-3 py-2">{r.phone ?? ""}</td>
                      <td className="px-3 py-2">{new Date(r.verifiedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">{r.verifiedBy ?? "admin"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>No verifications yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
