import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../hooks/useAuthStore";

export function LoginPage() {
	const navigate = useNavigate();
	const setAuth = useAuthStore((state) => state.setAuth);
	const [form, setForm] = useState({ email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const response = await api.post("/auth/login", form);
			setAuth({ user: response.data.user, token: response.data.token });
			navigate("/dashboard");
		} catch (err: any) {
			setError(err.response?.data?.error?.message ?? "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-4">
			<div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-xl backdrop-blur">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-2xl font-bold text-white">
						VBS
					</div>
					<h1 className="text-2xl font-semibold text-slate-900">VBS Ticketing Admin</h1>
					<p className="text-sm text-slate-500">Sign in to manage tickets, events and payments.</p>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="block text-sm font-medium text-slate-700">Email</label>
						<input
							type="email"
							required
							value={form.email}
							onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
							className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-slate-700">Password</label>
						<input
							type="password"
							required
							value={form.password}
							onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
							className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
						/>
					</div>
					{error ? <p className="text-sm text-red-600">{error}</p> : null}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>
				<p className="mt-6 text-center text-xs text-slate-400">
					Need access? Contact the Super Admin to create an account.
				</p>
			</div>
		</div>
	);
}

