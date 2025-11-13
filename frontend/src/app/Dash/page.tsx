"use client";
import React from "react";
import { useAuth } from "../AuthContext";
import { BillManager } from "./components/BillManager";

export default function DashPage() {
	const { user, loader } = useAuth();

	if (loader) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
			</div>
		);
	}

	// Restrict Bills to admin only
	if (user?.role !== "admin") {
		return (
			<div className="min-h-screen grid place-items-center bg-white">
				<div className="dialog-surface-login max-w-md w-full p-6 text-center">
					<h2 className="text-xl font-semibold text-slate-800">Access restricted</h2>
					<p className="text-slate-600 mt-2">Only admins can view the Bills dashboard.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				<div>
					<h1 className="text-2xl font-bold text-black">BILLS DASHBOARD</h1>
					<p className="text-gray-400">View and manage bills organized by financial year.</p>
				</div>

				<BillManager />
			</div>
		</div>
	);
}

