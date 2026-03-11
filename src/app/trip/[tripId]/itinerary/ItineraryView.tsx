"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import DayMap from "@/components/DayMap";

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
    lat?: number;
    lng?: number;
    mapQuery?: string;
    place?: string;
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

const typeLabels: Record<string, string> = {
    group: "GROUP",
    solo: "SOLO",
    subgroup: "SUBGROUP",
};

const categorySymbols: Record<string, string> = {
    food: "〰",
    activity: "✹",
    transportation: "↑",
    free: "□",
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
    const [highlightedActivityIndex, setHighlightedActivityIndex] = useState<number | null>(null);

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
        <div className="min-h-screen pb-16">
            {/* Sticky header */}
            <div className="sticky top-16 z-30 border-b-4 border-foreground bg-background">
                <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-xl font-black uppercase tracking-tighter text-foreground truncate">{trip.name}</h1>
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mt-0.5 truncate">
                                ⌖ {destination} · {trip.trip_duration_days || days.length} DAYS
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href={`/trip/${trip.id}/status`}
                                className="border-2 border-foreground bg-background px-3 py-1.5 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
                            >
                                ← BACK
                            </Link>
                            <button
                                onClick={() => setShowNarration(true)}
                                className="border-2 border-foreground bg-foreground px-3 py-1.5 text-xs font-black uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
                            >
                                ♪ LISTEN
                            </button>
                        </div>
                    </div>

                    {/* Group / My Schedule toggle */}
                    {currentUserName && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="inline-flex border-2 border-foreground overflow-hidden">
                                <button
                                    onClick={() => setViewMode("group")}
                                    className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors ${
                                        viewMode === "group"
                                            ? "bg-foreground text-background"
                                            : "bg-background text-foreground hover:bg-foreground/10"
                                    }`}
                                >
                                    ■ GROUP VIEW
                                </button>
                                <button
                                    onClick={() => setViewMode("my")}
                                    className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors ${
                                        viewMode === "my"
                                            ? "bg-foreground text-background"
                                            : "bg-background text-foreground hover:bg-foreground/10"
                                    }`}
                                >
                                    ○ MY SCHEDULE
                                </button>
                            </div>
                            <Link
                                href={`/trip/${trip.id}/budget`}
                                className="ml-auto border-2 border-foreground bg-background px-3 py-1.5 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
                            >
                                ✹ MY BUDGET
                            </Link>
                        </div>
                    )}

                    {/* Day tabs */}
                    <div className="mt-3 flex gap-0 overflow-x-auto pb-1 -mx-1 px-1">
                        <button
                            onClick={() => setActiveDay(-3)}
                            className={`shrink-0 border-2 border-foreground px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors -mr-0.5 ${
                                activeDay === -3 ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground/10"
                            }`}
                        >
                            OVERVIEW
                        </button>
                        {days.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveDay(i)}
                                className={`shrink-0 border-2 border-foreground px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors -mr-0.5 ${
                                    activeDay === i ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground/10"
                                }`}
                            >
                                DAY {day.day_number}
                            </button>
                        ))}
                        {budgetSummary && (
                            <button
                                onClick={() => setActiveDay(-2)}
                                className={`shrink-0 border-2 border-foreground px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-colors -mr-0.5 ${
                                    activeDay === -2 ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-foreground/10"
                                }`}
                            >
                                BUDGET
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 pt-16 sm:px-6">
                {/* Overview tab */}
                {activeDay === -3 && (
                    <div className="animate-fade-in space-y-8">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground border-b-4 border-foreground pb-4">TRIP OVERVIEW</h2>

                        {/* Transportation */}
                        {transportation && (
                            <div className="border-4 border-foreground bg-background p-6">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                                    ↑ GETTING THERE
                                </h3>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <span className="border-2 border-foreground bg-foreground px-4 py-1.5 text-xs font-black uppercase tracking-widest text-background">
                                        {transportation.type.toUpperCase()}
                                    </span>
                                    <span className="border-2 border-foreground bg-background px-4 py-1.5 text-xs font-black uppercase tracking-widest text-foreground">
                                        ~${transportation.estimated_cost_pp}/PERSON
                                    </span>
                                </div>
                                <p className="mt-4 text-sm font-bold uppercase tracking-widest text-foreground/80 border-l-4 border-foreground pl-4">{transportation.notes}</p>
                            </div>
                        )}

                        {/* Accommodation Options */}
                        {accommodationOptions.length > 0 && (
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground border-b-4 border-foreground pb-4 mb-6">□ WHERE TO STAY</h3>
                                <div className="space-y-4">
                                    {accommodationOptions.map((option, i) => (
                                        <div
                                            key={i}
                                            className={`border-4 p-5 ${
                                                accommodation?.recommended === option.name
                                                    ? "border-foreground bg-foreground"
                                                    : "border-foreground bg-background"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h4 className={`font-black text-xl uppercase tracking-tighter ${
                                                            accommodation?.recommended === option.name ? "text-background" : "text-foreground"
                                                        }`}>{option.name}</h4>
                                                        {accommodation?.recommended === option.name && (
                                                            <span className="border-2 border-background px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-background">
                                                                ✹ TOP PICK
                                                            </span>
                                                        )}
                                                        {option.confidence && (
                                                            <span className={`border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                                                                accommodation?.recommended === option.name
                                                                    ? "border-background text-background"
                                                                    : "border-foreground text-foreground"
                                                            }`}>
                                                                {option.confidence === "verified" ? "✓ VERIFIED" : "~ SUGGESTED"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest mt-1 block ${
                                                        accommodation?.recommended === option.name ? "text-background/70" : "text-foreground/60"
                                                    }`}>{option.type.toUpperCase()}</span>
                                                </div>
                                                <span className={`shrink-0 text-2xl font-black uppercase tracking-tighter ${
                                                    accommodation?.recommended === option.name ? "text-background" : "text-foreground"
                                                }`}>
                                                    ${option.cost_per_night}/NIGHT
                                                </span>
                                            </div>
                                            <p className={`mt-4 text-sm font-bold uppercase tracking-widest ${
                                                accommodation?.recommended === option.name ? "text-background/80" : "text-foreground/70"
                                            }`}>{option.reasoning}</p>
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
                        <div className="mb-8 border-b-4 border-foreground pb-4">
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">
                                DAY {days[activeDay].day_number}: {days[activeDay].theme.toUpperCase()}
                            </h2>
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mt-2">{days[activeDay].date}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Timeline */}
                            <div className="relative">
                            <div className="absolute left-6 top-0 bottom-0 w-1 bg-foreground" />

                            <div className="space-y-5">
                                {days[activeDay].activities.filter(isMyActivity).map((activity, i) => {
                                    const isSolo = activity.type === "solo" || activity.type === "subgroup";
                                    const isPersonalActivity = viewMode === "my" && isSolo;
                                    const typeLabel = typeLabels[activity.type] || "GROUP";
                                    const catSymbol = categorySymbols[activity.category] || "□";
                                    const reasoningKey = `${activeDay}-${i}`;
                                    const isExpanded = expandedReasoning === reasoningKey;

                                    return (
                                        <div 
                                            key={i} 
                                            className="relative flex gap-5"
                                            onMouseEnter={() => setHighlightedActivityIndex(i)}
                                            onMouseLeave={() => setHighlightedActivityIndex(null)}
                                        >
                                            {/* Timeline node */}
                                            <div className={`relative z-10 mt-1 flex h-12 w-12 shrink-0 items-center justify-center border-4 border-foreground text-xl font-black ${
                                                isPersonalActivity ? "bg-foreground text-background" : "bg-background text-foreground"
                                            }`}>
                                                {catSymbol}
                                            </div>

                                            {/* Card */}
                                            <div className="flex-1 border-4 border-foreground bg-background p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <span className="text-xs font-black uppercase tracking-widest text-foreground/60">
                                                                {activity.time}
                                                            </span>
                                                            <span className="border-2 border-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground">
                                                                {typeLabel}
                                                            </span>
                                                            {activity.confidence && (
                                                                <span className={`border-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                                                                    activity.confidence === "verified"
                                                                        ? "border-foreground bg-foreground text-background"
                                                                        : "border-foreground/40 text-foreground/60"
                                                                }`}>
                                                                    {activity.confidence === "verified" ? "✓ VERIFIED" : "~ SUGGESTED"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-black text-lg uppercase tracking-tighter text-foreground">
                                                            {activity.name}
                                                        </h3>
                                                        <p className="mt-1 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                                            {activity.description}
                                                        </p>
                                                        {activity.dietary_notes && (
                                                            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-foreground/60 border-l-4 border-foreground pl-3">
                                                                {activity.dietary_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {activity.estimated_cost_pp > 0 && (
                                                        <span className="shrink-0 border-2 border-foreground bg-foreground px-3 py-1 text-xs font-black uppercase tracking-widest text-background">
                                                            ${activity.estimated_cost_pp}/PP
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Participants */}
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {activity.participants.map((p, j) => (
                                                        <span
                                                            key={j}
                                                            className="border-2 border-foreground px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-foreground"
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
                                                        className="mt-3 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
                                                    >
                                                        ↔ {isExpanded ? "HIDE REASONING" : "WHY THIS?"}
                                                    </button>
                                                )}
                                                {isExpanded && activity.reasoning && (
                                                    <p className="mt-2 border-4 border-foreground bg-foreground/10 p-3 text-xs font-bold uppercase tracking-widest text-foreground/80 animate-fade-in">
                                                        {activity.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                            {/* Map */}
                            <div className="sticky top-40 hidden lg:block">
                                <DayMap 
                                    stops={days[activeDay].activities.filter(isMyActivity).map((act, index) => ({
                                        index,
                                        name: act.name,
                                        time: act.time,
                                        description: act.description,
                                        lat: act.lat || 0,
                                        lng: act.lng || 0,
                                        mapQuery: act.mapQuery,
                                        place: act.place,
                                        category: act.category
                                    })).filter(stop => stop.lat !== 0 && stop.lng !== 0)} 
                                    highlightedIndex={highlightedActivityIndex} 
                                />
                            </div>
                        </div>

                        {/* Empty state */}
                        {viewMode === "my" &&
                            days[activeDay].activities.filter(isMyActivity).length === 0 && (
                                <div className="text-center py-16 border-4 border-foreground">
                                    <p className="text-6xl font-black uppercase tracking-tighter text-foreground mb-4">□</p>
                                    <p className="text-sm font-bold uppercase tracking-widest text-foreground/70">FREE TIME — NO SCHEDULED ACTIVITIES FOR YOU THIS DAY</p>
                                </div>
                            )}
                    </div>
                )}

                {/* Budget view */}
                {activeDay === -2 && budgetSummary && (
                    <div className="animate-fade-in">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground border-b-4 border-foreground pb-4 mb-2">
                            BUDGET BREAKDOWN
                        </h2>
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground/70 mb-8">
                            GROUP TOTAL: <span className="text-foreground">${budgetSummary.group_total?.toLocaleString()}</span>
                        </p>

                        {/* Budget warning banner */}
                        {(() => {
                            const overBudgetMembers = Object.entries(budgetSummary.per_person || {}).filter(
                                ([name, b]) => memberBudgets[name] != null && b.total > memberBudgets[name]
                            );
                            if (overBudgetMembers.length === 0) return null;
                            return (
                                <div className="mb-8 border-4 border-foreground bg-foreground px-5 py-4">
                                    <p className="text-sm font-black uppercase tracking-tighter text-background">
                                        ! HEADS UP — THIS PLAN MAY EXCEED SOME BUDGETS
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        {overBudgetMembers.map(([name, b]) => {
                                            const overBy = b.total - memberBudgets[name];
                                            return (
                                                <p key={name} className="text-xs font-bold uppercase tracking-widest text-background/80">
                                                    {name}'s estimate (${b.total.toLocaleString()}) is ${overBy.toLocaleString()} over their ${memberBudgets[name].toLocaleString()} budget
                                                </p>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="grid gap-5 sm:grid-cols-2">
                            {Object.entries(budgetSummary.per_person || {}).map(
                                ([name, budget]) => {
                                    const stated = memberBudgets[name];
                                    let isOver = false;
                                    let isClose = false;
                                    let isUnder = false;
                                    let statusLabel = "";

                                    if (stated != null) {
                                        const ratio = budget.total / stated;
                                        if (ratio > 1) { isOver = true; statusLabel = `$${(budget.total - stated).toLocaleString()} OVER BUDGET`; }
                                        else if (ratio > 0.9) { isClose = true; statusLabel = "WITHIN 10% OF BUDGET"; }
                                        else { isUnder = true; statusLabel = `$${(stated - budget.total).toLocaleString()} UNDER BUDGET`; }
                                    }

                                    return (
                                        <div
                                            key={name}
                                            className={`border-4 p-5 ${
                                                isOver ? "border-foreground bg-foreground" :
                                                isClose ? "border-foreground" :
                                                "border-foreground"
                                            }`}
                                        >
                                            <h3 className={`font-black text-xl uppercase tracking-tighter ${
                                                isOver ? "text-background" : "text-foreground"
                                            }`}>{name}</h3>
                                            <p className={`text-4xl font-black uppercase tracking-tighter mt-1 ${
                                                isOver ? "text-background" : "text-foreground"
                                            }`}>
                                                ${budget.total?.toLocaleString()}
                                            </p>

                                            {/* Budget bar */}
                                            {stated != null && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                                        <span className={isOver ? "text-background/70" : "text-foreground/60"}>ESTIMATED</span>
                                                        <span className={isOver ? "text-background/70" : "text-foreground/60"}>BUDGET: ${stated.toLocaleString()}</span>
                                                    </div>
                                                    <div className={`h-5 border-2 overflow-hidden ${
                                                        isOver ? "border-background bg-background/20" : "border-foreground bg-background"
                                                    }`}>
                                                        <div
                                                            className={isOver ? "h-full bg-background" : "h-full bg-foreground"}
                                                            style={{ width: `${Math.min((budget.total / stated) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${
                                                        isOver ? "text-background" : "text-foreground/70"
                                                    }`}>
                                                        {statusLabel}
                                                    </p>
                                                </div>
                                            )}

                                            <div className={`mt-5 space-y-3 border-t-4 pt-4 ${
                                                isOver ? "border-background/30" : "border-foreground/20"
                                            }`}>
                                                {[
                                                    { label: "ACCOMMODATION", value: budget.accommodation },
                                                    { label: "FOOD", value: budget.food },
                                                    { label: "ACTIVITIES", value: budget.activities },
                                                    { label: "TRANSPORT", value: budget.transportation },
                                                ].map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className={`flex justify-between text-xs font-bold uppercase tracking-widest ${
                                                            isOver ? "text-background/70" : "text-foreground/70"
                                                        }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        <span className={isOver ? "text-background" : "text-foreground"}>
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
