"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Recommendation {
    id?: string;
    destination: string;
    name?: string;
    score: number;
    pros: string[];
    cons: string[];
    estimated_budget_pp?: number;
    estimatedBudgetPerPerson?: number;
    reasoning: string;
}

interface LocationsClientProps {
    tripId: string;
    tripName: string;
    tripDuration: number;
    isLeader: boolean;
    existingRecommendations: Recommendation[];
}

const loadingMessages = [
    "🔍 Analyzing your group's preferences...",
    "🧠 Synthesizing vibes, budgets, and dietary needs...",
    "🗺️ Scoring 20 destinations against your group profile...",
    "✨ Finding the perfect matches...",
    "📊 Ranking destinations by group fit...",
];

export default function LocationsClient({
    tripId,
    tripName,
    tripDuration,
    isLeader,
    existingRecommendations,
}: LocationsClientProps) {
    const router = useRouter();
    const [phase, setPhase] = useState<
        "idle" | "synthesizing" | "recommending" | "generating" | "done" | "error" | "budget_warning"
    >(existingRecommendations.length > 0 ? "done" : "idle");
    const [recommendations, setRecommendations] = useState<Recommendation[]>(
        existingRecommendations
    );
    const [synthesis, setSynthesis] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState("");
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);
    const [budgetWarning, setBudgetWarning] = useState<{
        message: string;
        lowest_budget: number;
        lowest_budget_member: string;
        cheapest_destination: string;
        cheapest_estimated_cost: number;
        options: string[];
        all_recommendations: Recommendation[];
    } | null>(null);

    // Cycle through loading messages
    useEffect(() => {
        if (phase !== "synthesizing" && phase !== "recommending" && phase !== "generating") return;
        const interval = setInterval(() => {
            setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [phase]);

    const handleAnalyze = async () => {
        setPhase("synthesizing");
        setError("");

        try {
            // Step 1: Synthesize preferences
            const synthRes = await fetch(`/api/trips/${tripId}/synthesize`, {
                method: "POST",
            });
            const synthData = await synthRes.json();
            if (!synthRes.ok) throw new Error(synthData.error);
            setSynthesis(synthData.synthesis);

            // Step 2: Get location recommendations
            setPhase("recommending");
            const recRes = await fetch(`/api/trips/${tripId}/recommend-locations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ synthesis: synthData.synthesis }),
            });
            const recData = await recRes.json();
            if (!recRes.ok) throw new Error(recData.error);

            // Check for budget_insufficient response
            if (recData.status === "budget_insufficient") {
                setBudgetWarning(recData);
                setPhase("budget_warning");
                return;
            }

            setRecommendations(recData.recommendations || []);
            setPhase("done");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setPhase("error");
        }
    };

    const handleChooseDestination = async (destination: string) => {
        setGeneratingFor(destination);
        setPhase("generating");
        setError("");

        try {
            const res = await fetch(`/api/trips/${tripId}/generate-itinerary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, synthesis }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            router.push(`/trip/${tripId}/itinerary`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Itinerary generation failed");
            setPhase("done");
            setGeneratingFor(null);
        }
    };

    // Loading state
    if (phase === "synthesizing" || phase === "recommending" || phase === "generating") {
        return (
            <div className="min-h-screen pt-24 pb-16">
                <div className="mx-auto max-w-2xl px-4 text-center">
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center border-4 border-foreground bg-foreground text-5xl text-background">
                        ⚑
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                        {phase === "generating"
                            ? `BUILDING ${generatingFor?.toUpperCase()} ITINERARY`
                            : "AI ON IT"}
                    </h1>
                    <p className="mt-6 text-sm font-bold uppercase tracking-widest text-foreground/70 animate-pulse" key={loadingMsgIndex}>
                        {phase === "generating"
                            ? "CREATING A PERSONALIZED DAY-BY-DAY PLAN..."
                            : loadingMessages[loadingMsgIndex].replace(/[^a-zA-Z0-9$%.,()&\s\u2014\u2013]/g, "").trim().toUpperCase()}
                    </p>

                    {/* Progress blocks */}
                    <div className="mt-12 flex justify-center gap-3">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`h-4 w-12 border-4 border-foreground transition-all duration-500 ${
                                    (phase === "synthesizing" && i === 0) ||
                                    (phase === "recommending" && i <= 1) ||
                                    (phase === "generating" && i <= 2)
                                        ? "bg-foreground"
                                        : "bg-background"
                                }`}
                            />
                        ))}
                    </div>

                    <p className="mt-6 text-xs font-bold uppercase tracking-widest text-foreground/50">
                        THIS MAY TAKE 10-20 SECONDS
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                {/* Header */}
                <div className="border-b-4 border-foreground pb-6 text-center">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                        {recommendations.length > 0
                            ? "AI PICKS"
                            : `WHERE SHOULD ${tripName.toUpperCase()} GO?`}
                    </h1>
                    <p className="mt-4 text-sm font-bold uppercase tracking-widest text-foreground/70">
                        {recommendations.length > 0
                            ? "BASED ON YOUR GROUP'S COMBINED PREFERENCES"
                            : "LET OUR AI ANALYZE YOUR GROUP'S PREFERENCES AND FIND THE PERFECT DESTINATION"}
                    </p>
                </div>

                {/* Idle state — trigger analysis */}
                {phase === "idle" && (
                    <div className="mt-16 text-center">
                        <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center border-4 border-foreground bg-foreground text-5xl text-background">
                            ⚑
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground/70 max-w-md mx-auto mb-10">
                            OUR AI WILL SYNTHESIZE EVERYONE'S PREFERENCES, SCORE 20 US DESTINATIONS,
                            AND RECOMMEND THE BEST MATCHES FOR YOUR GROUP.
                        </p>
                        {isLeader ? (
                            <button
                                onClick={handleAnalyze}
                                className="w-full md:w-auto inline-block border-4 border-foreground bg-foreground px-12 py-5 text-xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
                            >
                                ANALYZE &amp; RECOMMEND ↗
                            </button>
                        ) : (
                            <p className="text-sm font-bold uppercase tracking-widest text-foreground/50">
                                WAITING FOR TRIP LEADER TO START ANALYSIS...
                            </p>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-8 border-4 border-foreground bg-foreground px-4 py-4 text-sm font-bold uppercase tracking-widest text-background flex flex-col sm:flex-row items-center gap-4">
                        <span className="flex-1">ERROR: {error}</span>
                        <button
                            onClick={() => {
                                setPhase("idle");
                                setError("");
                            }}
                            className="border-4 border-background bg-background px-5 py-2 text-sm font-black uppercase tracking-widest text-foreground whitespace-nowrap transition-colors hover:bg-foreground hover:text-background"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                )}

                {/* Budget warning */}
                {phase === "budget_warning" && budgetWarning && (
                    <div className="mt-8 animate-fade-in">
                        <div className="border-4 border-foreground bg-background p-6">
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center border-4 border-foreground bg-foreground text-2xl text-background font-black">
                                    !
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                                        BUDGET MISMATCH
                                    </h3>
                                    <p className="mt-3 text-sm font-bold uppercase tracking-widest text-foreground/80">
                                        {budgetWarning.message}
                                    </p>
                                    <div className="mt-4 space-y-2 border-t-4 border-foreground/20 pt-4">
                                        {budgetWarning.options.map((opt, i) => (
                                            <p key={i} className="text-sm font-bold uppercase tracking-widest text-foreground/70">
                                                {i + 1}. {opt}
                                            </p>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={() => router.push(`/trip/${tripId}/preferences`)}
                                            className="flex-1 border-4 border-foreground bg-background py-4 text-base font-black uppercase tracking-tighter text-foreground transition-colors hover:bg-foreground hover:text-background"
                                        >
                                            ← ADJUST BUDGETS
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRecommendations(
                                                    budgetWarning.all_recommendations.map((r: any) => ({
                                                        ...r,
                                                        destination: r.name || r.destination,
                                                    }))
                                                );
                                                setBudgetWarning(null);
                                                setPhase("done");
                                            }}
                                            className="flex-1 border-4 border-foreground bg-foreground py-4 text-base font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
                                        >
                                            SHOW PLANS ANYWAY ↗
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommendation cards */}
                {recommendations.length > 0 && phase === "done" && (
                    <div className="mt-10 space-y-6">
                        {recommendations.map((rec, index) => {
                            const name = rec.name || rec.destination;
                            const budget = rec.estimatedBudgetPerPerson || rec.estimated_budget_pp;
                            return (
                                <div
                                    key={index}
                                    className="border-4 border-foreground bg-background p-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                                        {/* Score block */}
                                        <div className="shrink-0 flex flex-col items-center">
                                            <div className="flex h-20 w-20 items-center justify-center border-4 border-foreground bg-foreground text-background text-2xl font-black">
                                                {rec.score}
                                            </div>
                                            <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-foreground/70">
                                                SCORE
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                                                        {index === 0 && "#1 "}
                                                        {index === 1 && "#2 "}
                                                        {index === 2 && "#3 "}
                                                        {name}
                                                    </h3>
                                                    {budget && (
                                                        <p className="text-sm font-bold uppercase tracking-widest text-foreground/70 mt-1">
                                                            ~${budget.toLocaleString()}/PERSON FOR {tripDuration} DAYS
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-foreground/80 border-l-4 border-foreground pl-4">
                                                {rec.reasoning}
                                            </p>

                                            {/* Pros & Cons */}
                                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="border-4 border-foreground p-4">
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground mb-3">
                                                        ✓ PROS
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {rec.pros.map((pro, i) => (
                                                            <p key={i} className="text-xs font-bold uppercase tracking-widest text-foreground/80">
                                                                — {pro}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="border-4 border-foreground bg-foreground p-4">
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-background mb-3">
                                                        ⧖ TRADEOFFS
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {rec.cons.map((con, i) => (
                                                            <p key={i} className="text-xs font-bold uppercase tracking-widest text-background/80">
                                                                — {con}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Choose button */}
                                            {isLeader && (
                                                <button
                                                    onClick={() => handleChooseDestination(name)}
                                                    className={`mt-6 w-full sm:w-auto border-4 px-8 py-4 text-base font-black uppercase tracking-tighter transition-colors ${
                                                        index === 0
                                                            ? "border-foreground bg-foreground text-background hover:bg-background hover:text-foreground"
                                                            : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                                                    }`}
                                                >
                                                    CHOOSE {name.toUpperCase()} ↗
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
