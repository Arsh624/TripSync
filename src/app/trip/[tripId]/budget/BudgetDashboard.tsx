"use client";

import Link from "next/link";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface MyBudget {
    total: number;
    accommodation: number;
    food: number;
    activities: number;
    transportation: number;
    savings_tips: string | null;
}

interface BudgetDashboardProps {
    tripId: string;
    tripName: string;
    destination: string;
    userName: string;
    myBudget: MyBudget | null;
    statedBudget: number | null;
    groupTotal: number | null;
    memberCount: number;
}

const CATEGORIES = [
    { key: "accommodation", label: "Accommodation", icon: "🏨", color: "#818cf8" },
    { key: "food", label: "Food", icon: "🍽️", color: "#34d399" },
    { key: "activities", label: "Activities", icon: "🎯", color: "#fbbf24" },
    { key: "transportation", label: "Transportation", icon: "🚗", color: "#f87171" },
] as const;

export default function BudgetDashboard({
    tripId,
    tripName,
    destination,
    userName,
    myBudget,
    statedBudget,
    groupTotal,
    memberCount,
}: BudgetDashboardProps) {
    if (!myBudget) {
        return (
            <div className="min-h-screen pt-24 pb-16 page-transition">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
                    <div className="text-5xl mb-4">💰</div>
                    <h1 className="text-2xl font-bold text-foreground">No Budget Data Yet</h1>
                    <p className="mt-2 text-muted">
                        The itinerary hasn&apos;t generated budget estimates for you yet.
                    </p>
                    <Link
                        href={`/trip/${tripId}/itinerary`}
                        className="mt-6 inline-flex items-center gap-2 rounded-full gradient-bg px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                    >
                        ← Back to Itinerary
                    </Link>
                </div>
            </div>
        );
    }

    const total = myBudget.total;
    const chartData = CATEGORIES.map((cat) => ({
        name: cat.label,
        value: myBudget[cat.key as keyof MyBudget] as number,
        icon: cat.icon,
        color: cat.color,
    })).filter((d) => d.value > 0);

    // Budget status
    let budgetStatus: "under" | "close" | "over" = "under";
    let budgetPercent = 0;
    let barColor = "bg-emerald-500";
    let statusText = "";
    let statusColor = "text-emerald-500";

    if (statedBudget != null && statedBudget > 0) {
        budgetPercent = (total / statedBudget) * 100;
        if (total > statedBudget) {
            budgetStatus = "over";
            barColor = "bg-red-500";
            statusText = `$${(total - statedBudget).toLocaleString()} over budget`;
            statusColor = "text-red-500";
        } else if (budgetPercent >= 90) {
            budgetStatus = "close";
            barColor = "bg-amber-500";
            statusText = `$${(statedBudget - total).toLocaleString()} remaining — cutting it close`;
            statusColor = "text-amber-500";
        } else {
            statusText = `$${(statedBudget - total).toLocaleString()} under budget`;
        }
    }

    return (
        <div className="min-h-screen pb-16 page-transition">
            {/* Header */}
            <div className="sticky top-16 z-30 border-b border-border bg-card/95 backdrop-blur-md">
                <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-foreground">My Budget</h1>
                            <p className="text-xs text-muted">
                                📍 {destination} · {tripName}
                            </p>
                        </div>
                        <Link
                            href={`/trip/${tripId}/itinerary`}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-hover transition-all"
                        >
                            ← Itinerary
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 space-y-6">
                {/* Big total number */}
                <div className="text-center py-4">
                    <p className="text-sm text-muted font-medium uppercase tracking-wider">
                        Your Estimated Total
                    </p>
                    <p className="text-5xl font-extrabold gradient-text mt-1">
                        ${total.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted mt-1">{userName}</p>
                </div>

                {/* Budget progress bar */}
                {statedBudget != null && statedBudget > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground">
                                Budget Progress
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                                ${total.toLocaleString()}{" "}
                                <span className="text-muted font-normal">
                                    / ${statedBudget.toLocaleString()}
                                </span>
                            </span>
                        </div>
                        <div className="h-4 rounded-full bg-border overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                style={{
                                    width: `${Math.min(budgetPercent, 100)}%`,
                                }}
                            />
                        </div>
                        <p className={`text-sm font-medium mt-2 ${statusColor}`}>
                            {budgetStatus === "over" && "⚠️ "}
                            {budgetStatus === "close" && "⏳ "}
                            {budgetStatus === "under" && "✅ "}
                            {statusText}
                        </p>
                    </div>
                )}

                {/* Donut chart */}
                <div className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="text-base font-semibold text-foreground mb-4">
                        Spending Breakdown
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-48 h-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [
                                            `$${Number(value).toLocaleString()}`,
                                            "",
                                        ]}
                                        contentStyle={{
                                            backgroundColor: "var(--card)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "12px",
                                            color: "var(--foreground)",
                                            fontSize: "13px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 w-full space-y-3">
                            {CATEGORIES.map((cat) => {
                                const value = myBudget[cat.key as keyof MyBudget] as number;
                                const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                                return (
                                    <div key={cat.key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="text-sm text-foreground">
                                                {cat.icon} {cat.label}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-foreground">
                                                ${value.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-muted ml-1.5">
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Savings tips (only if over budget) */}
                {budgetStatus === "over" && myBudget.savings_tips && (
                    <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-5">
                        <h2 className="text-base font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                            💡 Tips to Save Money
                        </h2>
                        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                            {myBudget.savings_tips}
                        </p>
                    </div>
                )}

                {/* Group total */}
                {groupTotal != null && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted">Group Total</p>
                                <p className="text-2xl font-bold text-foreground">
                                    ${groupTotal.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted">Travelers</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {memberCount}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm text-muted">
                            <span>Average per person</span>
                            <span className="font-medium text-foreground">
                                ${memberCount > 0 ? Math.round(groupTotal / memberCount).toLocaleString() : 0}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
