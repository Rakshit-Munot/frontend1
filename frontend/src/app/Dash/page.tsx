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

