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
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">NO BUDGET DATA YET</h1>
                    <p className="text-sm font-bold uppercase tracking-widest text-foreground/70 mt-2">
                        THE ITINERARY HASN'T GENERATED BUDGET ESTIMATES FOR YOU YET.
                    </p>
                    <Link
                        href={`/trip/${tripId}/itinerary`}
                        className="mt-8 inline-flex items-center gap-2 border-4 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
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
            <div className="sticky top-16 z-30 border-b-4 border-foreground bg-background">
                <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">MY BUDGET</h1>
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground/70 mt-1">
                                📍 {destination} · {tripName}
                            </p>
                        </div>
                        <Link
                            href={`/trip/${tripId}/itinerary`}
                            className="border-2 border-foreground bg-background px-3 py-1.5 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
                        >
                            ← ITINERARY
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6 space-y-8">
                {/* Big total number */}
                <div className="text-center py-8 border-4 border-foreground bg-foreground text-background">
                    <p className="text-sm font-bold uppercase tracking-widest text-background/80">
                        YOUR ESTIMATED TOTAL
                    </p>
                    <p className="text-7xl font-black uppercase tracking-tighter mt-2">
                        ${total.toLocaleString()}
                    </p>
                    <p className="text-sm font-bold uppercase tracking-widest mt-2">{userName}</p>
                </div>

                {/* Budget progress bar */}
                {statedBudget != null && statedBudget > 0 && (
                    <div className="border-4 border-foreground bg-background p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-base sm:text-lg font-black uppercase tracking-widest text-foreground">
                                BUDGET PROGRESS
                            </span>
                            <span className="text-base sm:text-lg font-black uppercase tracking-widest text-foreground">
                                ${total.toLocaleString()}{" "}
                                <span className="text-foreground/50">
                                    / ${statedBudget.toLocaleString()}
                                </span>
                            </span>
                        </div>
                        <div className="h-6 border-4 border-foreground bg-background p-0.5 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-700 ${barColor}`}
                                style={{
                                    width: `${Math.min(budgetPercent, 100)}%`,
                                }}
                            />
                        </div>
                        <p className={`text-sm font-bold uppercase tracking-widest mt-4 ${statusColor}`}>
                            {budgetStatus === "over" && "⚠️ "}
                            {budgetStatus === "close" && "⏳ "}
                            {budgetStatus === "under" && "✅ "}
                            {statusText.toUpperCase()}
                        </p>
                    </div>
                )}

                {/* Donut chart */}
                <div className="border-4 border-foreground bg-background p-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground mb-8 border-b-4 border-foreground pb-4">
                        SPENDING BREAKDOWN
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
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
                                            backgroundColor: "var(--background)",
                                            border: "4px solid var(--foreground)",
                                            borderRadius: "0px",
                                            color: "var(--foreground)",
                                            fontSize: "12px",
                                            textTransform: "uppercase",
                                            fontWeight: "900",
                                            letterSpacing: "0.1em"
                                        }}
                                        itemStyle={{
                                            fontWeight: "900"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 w-full space-y-4">
                            {CATEGORIES.map((cat) => {
                                const value = myBudget[cat.key as keyof MyBudget] as number;
                                const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                                return (
                                    <div key={cat.key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 border-2 border-foreground shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="text-sm font-bold uppercase tracking-widest text-foreground">
                                                {cat.icon} {cat.label}
                                            </span>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <span className="text-base font-black text-foreground">
                                                ${value.toLocaleString()}
                                            </span>
                                            <span className="text-xs font-bold text-foreground/50 w-8 text-right">
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
                    <div className="border-4 border-amber-500 bg-amber-400 p-6 shadow-[8px_8px_0px_0px_rgba(245,158,11,1)]">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-amber-950 flex items-center gap-3 border-b-4 border-amber-950/20 pb-4 mb-4">
                            💡 TIPS TO SAVE MONEY
                        </h2>
                        <p className="text-sm font-bold uppercase tracking-wide text-amber-950 leading-relaxed">
                            {myBudget.savings_tips}
                        </p>
                    </div>
                )}

                {/* Group total */}
                {groupTotal != null && (
                    <div className="border-4 border-foreground bg-background p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-widest text-foreground/70">GROUP TOTAL</p>
                                <p className="text-4xl font-black uppercase tracking-tighter text-foreground mt-1">
                                    ${groupTotal.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold uppercase tracking-widest text-foreground/70">TRAVELERS</p>
                                <p className="text-4xl font-black uppercase tracking-tighter text-foreground mt-1">
                                    {memberCount}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t-4 border-foreground/10 flex items-center justify-between">
                            <span className="text-sm font-bold uppercase tracking-widest text-foreground/70">AVERAGE PER PERSON</span>
                            <span className="text-xl font-black text-foreground">
                                ${memberCount > 0 ? Math.round(groupTotal / memberCount).toLocaleString() : 0}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
