"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";

const NarrationPlayer = lazy(() => import("@/components/NarrationPlayer"));

interface Activity {
    time: string;
    name: string;
    description: string;
    participants: string[];
    type: "group" | "solo" | "subgroup";
    estimated_cost_pp: number;
    category: "food" | "activity" | "transportation" | "free";
    reasoning: string;
    confidence?: "verified" | "suggested";
    dietary_notes?: string;
}

interface Day {
    day_number: number;
    date: string;
    theme: string;
    activities: Activity[];
}

interface AccommodationOption {
    name: string;
    type: string;
    cost_per_night: number;
    reasoning: string;
    confidence?: "verified" | "suggested";
}

interface Transportation {
    type: "flight" | "drive" | "mixed";
    estimated_cost_pp: number;
    notes: string;
}

interface ItineraryData {
    days: Day[];
    accommodation?: {
        // New format with options
        options?: AccommodationOption[];
        recommended?: string;
        // Legacy single format
        name?: string;
        type?: string;
        cost_per_night?: number;
        reasoning?: string;
    };
    transportation?: Transportation;
    budget_summary?: {
        per_person: Record<string, { total: number; accommodation: number; food: number; activities: number; transportation: number }>;
        group_total: number;
    };
}

interface Member {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
}

interface ItineraryViewProps {
    trip: {
        id: string;
        name: string;
        trip_duration_days: number | null;
        start_date: string | null;
        share_code: string;
    };
    itinerary: ItineraryData;
    destination: string;
    members: Member[];
    memberBudgets?: Record<string, number>;
    currentUserName?: string;
}

const typeColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    group: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", label: "👥 Group" },
    solo: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", label: "🧍 Solo" },
    subgroup: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", label: "👫 Subgroup" },
};

const categoryIcons: Record<string, string> = {
    food: "🍽️",
    activity: "🎯",
    transportation: "🚗",
    free: "🌟",
};

export default function ItineraryView({
    trip,
    itinerary,
    destination,
    memberBudgets = {},
    currentUserName,
}: ItineraryViewProps) {
    const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);
    const [activeDay, setActiveDay] = useState(-3); // Start on overview
    const [showNarration, setShowNarration] = useState(false);
    const [viewMode, setViewMode] = useState<"group" | "my">("group");

    // Filter activities for "My Schedule" mode
    const isMyActivity = (activity: Activity) => {
        if (viewMode === "group" || !currentUserName) return true;
        return activity.participants.some(
            (p) =>
                p.toLowerCase() === "everyone" ||
                p.toLowerCase() === currentUserName.toLowerCase()
        );
    };

    const days = itinerary?.days || [];
    const accommodation = itinerary?.accommodation;
    const transportation = itinerary?.transportation;
    const budgetSummary = itinerary?.budget_summary;

    // Normalize accommodation to options format
    const accommodationOptions: AccommodationOption[] = accommodation?.options
        ? accommodation.options
        : accommodation?.name
            ? [{ name: accommodation.name, type: accommodation.type || "hotel", cost_per_night: accommodation.cost_per_night || 0, reasoning: accommodation.reasoning || "", confidence: "suggested" as const }]
            : [];

    return (
        <div className="min-h-screen pb-16 page-transition">
            {/* Sticky header — below navbar */}
            <div className="sticky top-16 z-30 border-b border-border bg-card/95 backdrop-blur-md">
                <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-foreground">{trip.name}</h1>
                            <p className="text-xs text-muted">
                                📍 {destination} · {trip.trip_duration_days || days.length} days
                            </p>
                        </div>
                        <Link
                            href={`/trip/${trip.id}/status`}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-hover transition-all"
                        >
                            ← Back
                        </Link>
                        <button
                            onClick={() => setShowNarration(true)}
                            className="rounded-lg gradient-bg px-3 py-1.5 text-xs font-medium text-white hover:shadow-md transition-all"
                        >
                            🔊 Listen
                        </button>
                    </div>

                    {/* Group / My Schedule toggle */}
                    {currentUserName && (
                        <div className="mt-2 flex items-center gap-1">
                            <div className="inline-flex rounded-lg border border-border p-0.5 bg-card-hover">
                                <button
                                    onClick={() => setViewMode("group")}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                        viewMode === "group"
                                            ? "gradient-bg text-white shadow-sm"
                                            : "text-muted hover:text-foreground"
                                    }`}
                                >
                                    👥 Group View
                                </button>
                                <button
                                    onClick={() => setViewMode("my")}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                        viewMode === "my"
                                            ? "bg-violet-500 text-white shadow-sm"
                                            : "text-muted hover:text-foreground"
                                    }`}
                                >
                                    🧍 My Schedule
                                </button>
                            </div>
                            <Link
                                href={`/trip/${trip.id}/budget`}
                                className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-hover transition-all"
                            >
                                💰 My Budget
                            </Link>
                        </div>
                    )}

                    {/* Day tabs */}
                    <div className="mt-2 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                        <button
                            onClick={() => setActiveDay(-3)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeDay === -3 ? "gradient-bg text-white shadow-sm" : "text-muted hover:bg-card-hover"}`}
                        >
                            📋 Overview
                        </button>
                        {days.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveDay(i)}
                                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeDay === i ? "gradient-bg text-white shadow-sm" : "text-muted hover:bg-card-hover"}`}
                            >
                                Day {day.day_number}
                            </button>
                        ))}
                        {budgetSummary && (
                            <button
                                onClick={() => setActiveDay(-2)}
                                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeDay === -2 ? "gradient-bg text-white shadow-sm" : "text-muted hover:bg-card-hover"}`}
                            >
                                💰 Budget
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
                {/* Overview tab — Transportation + Accommodation */}
                {activeDay === -3 && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-2xl font-bold text-foreground">Trip Overview</h2>

                        {/* Transportation */}
                        {transportation && (
                            <div className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    {transportation.type === "flight" ? "✈️" : transportation.type === "drive" ? "🚗" : "🚗✈️"} Getting There
                                </h3>
                                <div className="mt-3 flex gap-3">
                                    <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700 capitalize">
                                        {transportation.type}
                                    </span>
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                                        ~${transportation.estimated_cost_pp}/person
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-foreground/70">{transportation.notes}</p>
                            </div>
                        )}

                        {/* Accommodation Options */}
                        {accommodationOptions.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-3">🏨 Where to Stay</h3>
                                <div className="space-y-3">
                                    {accommodationOptions.map((option, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-xl border p-4 transition-all ${accommodation?.recommended === option.name
                                                ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                                                : "border-border bg-card"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-foreground">{option.name}</h4>
                                                        {accommodation?.recommended === option.name && (
                                                            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                                                ⭐ Top Pick
                                                            </span>
                                                        )}
                                                        {option.confidence && (
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${option.confidence === "verified"
                                                                ? "bg-blue-50 border border-blue-200 text-blue-700"
                                                                : "bg-amber-50 border border-amber-200 text-amber-700"
                                                                }`}>
                                                                {option.confidence === "verified" ? "✓ Verified" : "💡 Suggested"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted capitalize">{option.type}</span>
                                                </div>
                                                <span className="shrink-0 text-base font-bold gradient-text">
                                                    ${option.cost_per_night}/night
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-foreground/70">{option.reasoning}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Day view */}
                {activeDay >= 0 && days[activeDay] && (
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground">
                                Day {days[activeDay].day_number}: {days[activeDay].theme}
                            </h2>
                            <p className="text-sm text-muted mt-1">{days[activeDay].date}</p>
                        </div>

                        {/* Timeline */}
                        <div className="relative">
                            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                            <div className="space-y-4">
                                {days[activeDay].activities.filter(isMyActivity).map((activity, i) => {
                                    // In "My Schedule" mode, use violet accent for personal activities
                                    const isPersonalActivity =
                                        viewMode === "my" &&
                                        (activity.type === "solo" || activity.type === "subgroup");
                                    const typeStyle = isPersonalActivity
                                        ? {
                                              bg: "bg-violet-50 dark:bg-violet-950/30",
                                              border: "border-violet-300 dark:border-violet-500/40",
                                              text: "text-violet-700 dark:text-violet-300",
                                              label: activity.type === "solo" ? "🧍 Just You" : "👫 Subgroup",
                                          }
                                        : typeColors[activity.type] || typeColors.group;
                                    const reasoningKey = `${activeDay}-${i}`;
                                    const isExpanded = expandedReasoning === reasoningKey;

                                    return (
                                        <div key={i} className="relative flex gap-4">
                                            {/* Timeline dot */}
                                            <div
                                                className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${typeStyle.bg} ${typeStyle.border} border`}
                                            >
                                                {categoryIcons[activity.category] || "📌"}
                                            </div>

                                            {/* Card */}
                                            <div
                                                className={`flex-1 rounded-xl border ${typeStyle.border} ${typeStyle.bg} p-4 transition-all hover:shadow-sm`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-medium text-muted">
                                                                {activity.time}
                                                            </span>
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeStyle.text} ${typeStyle.bg} border ${typeStyle.border}`}
                                                            >
                                                                {typeStyle.label}
                                                            </span>
                                                            {activity.confidence && (
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${activity.confidence === "verified"
                                                                    ? "bg-blue-50/80 border border-blue-200 text-blue-600"
                                                                    : "bg-amber-50/80 border border-amber-200 text-amber-600"
                                                                    }`}>
                                                                    {activity.confidence === "verified" ? "✓" : "💡"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="mt-1 font-semibold text-foreground">
                                                            {activity.name}
                                                        </h3>
                                                        <p className="mt-0.5 text-sm text-foreground/70">
                                                            {activity.description}
                                                        </p>
                                                        {activity.dietary_notes && (
                                                            <p className="mt-1 text-xs text-emerald-600">
                                                                🥗 {activity.dietary_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {activity.estimated_cost_pp > 0 && (
                                                        <span className="shrink-0 rounded-lg bg-white/80 border border-border px-2 py-1 text-xs font-medium text-foreground">
                                                            ${activity.estimated_cost_pp}/pp
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Participants */}
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {activity.participants.map((p, j) => (
                                                        <span
                                                            key={j}
                                                            className="rounded-full bg-white/80 border border-border px-2 py-0.5 text-[11px] font-medium text-foreground"
                                                        >
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Reasoning toggle */}
                                                {activity.reasoning && (
                                                    <button
                                                        onClick={() =>
                                                            setExpandedReasoning(isExpanded ? null : reasoningKey)
                                                        }
                                                        className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                                    >
                                                        💡 {isExpanded ? "Hide reasoning" : "Why this?"}
                                                    </button>
                                                )}
                                                {isExpanded && activity.reasoning && (
                                                    <p className="mt-2 rounded-lg bg-white/60 border border-border p-3 text-xs text-foreground/70 animate-fade-in">
                                                        {activity.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Empty state for My Schedule */}
                        {viewMode === "my" &&
                            days[activeDay].activities.filter(isMyActivity).length === 0 && (
                                <div className="text-center py-12 text-muted">
                                    <p className="text-3xl mb-2">🏖️</p>
                                    <p className="text-sm">No scheduled activities for you this day — free time!</p>
                                </div>
                            )}
                    </div>
                )}

                {/* Budget view */}
                {activeDay === -2 && budgetSummary && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            💰 Budget Breakdown
                        </h2>
                        <p className="text-sm text-muted mb-6">
                            Group total: <span className="font-semibold text-foreground">${budgetSummary.group_total?.toLocaleString()}</span>
                        </p>

                        {/* Budget warning banner */}
                        {(() => {
                            const overBudgetMembers = Object.entries(budgetSummary.per_person || {}).filter(
                                ([name, b]) => memberBudgets[name] != null && b.total > memberBudgets[name]
                            );
                            if (overBudgetMembers.length === 0) return null;
                            return (
                                <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-900">
                                        ⚠️ Heads up — this plan may exceed some budgets
                                    </p>
                                    <div className="mt-2 space-y-1">
                                        {overBudgetMembers.map(([name, b]) => {
                                            const overBy = b.total - memberBudgets[name];
                                            return (
                                                <p key={name} className="text-xs text-amber-800">
                                                    {name}'s estimate (${b.total.toLocaleString()}) is ${overBy.toLocaleString()} over their ${memberBudgets[name].toLocaleString()} budget
                                                </p>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="grid gap-4 sm:grid-cols-2">
                            {Object.entries(budgetSummary.per_person || {}).map(
                                ([name, budget]) => {
                                    const stated = memberBudgets[name];
                                    let budgetColor = "border-border";
                                    let barColor = "gradient-bg";
                                    let statusLabel = "";
                                    let statusClass = "";

                                    if (stated != null) {
                                        const ratio = budget.total / stated;
                                        if (ratio > 1) {
                                            budgetColor = "border-red-300 ring-1 ring-red-200";
                                            barColor = "bg-red-500";
                                            statusLabel = `$${(budget.total - stated).toLocaleString()} over budget`;
                                            statusClass = "text-red-600";
                                        } else if (ratio > 0.9) {
                                            budgetColor = "border-amber-300 ring-1 ring-amber-200";
                                            barColor = "bg-amber-500";
                                            statusLabel = "Within 10% of budget";
                                            statusClass = "text-amber-600";
                                        } else {
                                            budgetColor = "border-emerald-300 ring-1 ring-emerald-200";
                                            barColor = "bg-emerald-500";
                                            statusLabel = `$${(stated - budget.total).toLocaleString()} under budget`;
                                            statusClass = "text-emerald-600";
                                        }
                                    }

                                    return (
                                        <div
                                            key={name}
                                            className={`rounded-xl border bg-card p-4 ${budgetColor}`}
                                        >
                                            <h3 className="font-semibold text-foreground">{name}</h3>
                                            <p className="text-xl font-bold gradient-text mt-1">
                                                ${budget.total?.toLocaleString()}
                                            </p>

                                            {/* Budget bar */}
                                            {stated != null && (
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-[10px] text-muted mb-1">
                                                        <span>Estimated</span>
                                                        <span>Budget: ${stated.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-border overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${barColor}`}
                                                            style={{ width: `${Math.min((budget.total / stated) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className={`text-[10px] font-medium mt-1 ${statusClass}`}>
                                                        {statusLabel}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-3 space-y-2">
                                                {[
                                                    { label: "🏨 Accommodation", value: budget.accommodation },
                                                    { label: "🍽️ Food", value: budget.food },
                                                    { label: "🎯 Activities", value: budget.activities },
                                                    { label: "🚗 Transportation", value: budget.transportation },
                                                ].map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className="flex justify-between text-xs text-muted"
                                                    >
                                                        <span>{item.label}</span>
                                                        <span className="font-medium text-foreground">
                                                            ${item.value?.toLocaleString() || 0}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Narration player modal */}
            {showNarration && (
                <Suspense fallback={null}>
                    <NarrationPlayer
                        tripId={trip.id}
                        itinerary={itinerary}
                        destination={destination}
                        members={[]}
                        onClose={() => setShowNarration(false)}
                    />
                </Suspense>
            )}
        </div>
    );
}
