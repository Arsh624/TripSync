"use client";

import { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";

const VoiceConversation = lazy(() => import("@/components/VoiceConversation"));

// ── Vibe config ──
const vibes = [
    { key: "vibe_beach", emoji: "🏖️", label: "Beach & Water" },
    { key: "vibe_city", emoji: "🏙️", label: "City & Urban" },
    { key: "vibe_nature", emoji: "🌲", label: "Nature & Outdoors" },
    { key: "vibe_culture", emoji: "🎨", label: "Art & Culture" },
    { key: "vibe_relaxation", emoji: "🧘", label: "Relaxation & Wellness" },
    { key: "vibe_nightlife", emoji: "🎉", label: "Nightlife & Entertainment" },
    { key: "vibe_adventure", emoji: "🏔️", label: "Adventure & Sports" },
] as const;

const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "Nut Allergy",
    "Dairy-Free",
    "None",
];

const mustHaveOptions = [
    "Good WiFi",
    "Pool",
    "Near beach",
    "Pet-friendly",
    "Walkable area",
    "Public transit",
    "Free parking",
];

const dealbreakerOptions = [
    "Long drives (3+ hrs)",
    "Extreme heat",
    "Extreme cold",
    "Crowds",
    "Remote areas",
    "No nightlife",
];

interface PreferenceFormProps {
    tripId: string;
    tripName: string;
    userName: string;
    existingPrefs: Record<string, unknown> | null;
    alreadySubmitted: boolean;
}

export default function PreferenceForm({
    tripId,
    tripName,
    userName,
    existingPrefs,
    alreadySubmitted,
}: PreferenceFormProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showVoice, setShowVoice] = useState(false);
    const [voiceCaptured, setVoiceCaptured] = useState(false);

    const handleVoiceComplete = (prefs: any) => {
        // Auto-populate all form fields from extracted voice data
        if (prefs.budget_max != null) setBudget(prefs.budget_max as number);
        if (prefs.activity_level) setActivityLevel(prefs.activity_level as string);
        if (prefs.accommodation_pref) setAccommodationPref(prefs.accommodation_pref as string);
        if (prefs.dietary_restrictions) setDietary(prefs.dietary_restrictions as string[]);
        if (prefs.dietary_notes) setDietaryNotes(prefs.dietary_notes as string);
        if (prefs.must_haves) setMustHaves(prefs.must_haves as string[]);
        if (prefs.dealbreakers) setDealbreakers(prefs.dealbreakers as string[]);
        if (prefs.additional_notes) setAdditionalNotes(prefs.additional_notes as string);

        // Populate vibe ratings
        const newVibes = { ...vibeRatings };
        for (const key of Object.keys(newVibes)) {
            if (prefs[key] != null) {
                newVibes[key] = prefs[key] as number;
            }
        }
        setVibeRatings(newVibes);

        setShowVoice(false);
        setVoiceCaptured(true);
        setStep(steps.length - 1); // Jump to summary
    };

    // ── Form state ──
    const [budget, setBudget] = useState(
        (existingPrefs?.budget_max as number) || 800
    );
    const [vibeRatings, setVibeRatings] = useState<Record<string, number>>({
        vibe_beach: (existingPrefs?.vibe_beach as number) || 3,
        vibe_city: (existingPrefs?.vibe_city as number) || 3,
        vibe_nature: (existingPrefs?.vibe_nature as number) || 3,
        vibe_culture: (existingPrefs?.vibe_culture as number) || 3,
        vibe_relaxation: (existingPrefs?.vibe_relaxation as number) || 3,
        vibe_nightlife: (existingPrefs?.vibe_nightlife as number) || 3,
        vibe_adventure: (existingPrefs?.vibe_adventure as number) || 3,
    });
    const [dietary, setDietary] = useState<string[]>(
        (existingPrefs?.dietary_restrictions as string[]) || []
    );
    const [dietaryNotes, setDietaryNotes] = useState(
        (existingPrefs?.dietary_notes as string) || ""
    );
    const [activityLevel, setActivityLevel] = useState<string>(
        (existingPrefs?.activity_level as string) || "moderate"
    );
    const [accommodationPref, setAccommodationPref] = useState<string>(
        (existingPrefs?.accommodation_pref as string) || "mid-range"
    );
    const [mustHaves, setMustHaves] = useState<string[]>(
        (existingPrefs?.must_haves as string[]) || []
    );
    const [dealbreakers, setDealbreakers] = useState<string[]>(
        (existingPrefs?.dealbreakers as string[]) || []
    );
    const [additionalNotes, setAdditionalNotes] = useState(
        (existingPrefs?.additional_notes as string) || ""
    );

    const steps = [
        "Welcome",
        "Budget",
        "Vibes",
        "Dietary",
        "Activities",
        "Open-ended",
    ];

    const toggleArray = (arr: string[], item: string) =>
        arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/trips/${tripId}/preferences`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    budget_min: Math.max(200, budget - 200),
                    budget_max: budget,
                    ...vibeRatings,
                    dietary_restrictions: dietary.filter((d) => d !== "None"),
                    dietary_notes: dietaryNotes || null,
                    activity_level: activityLevel,
                    accommodation_pref: accommodationPref,
                    must_haves: mustHaves,
                    dealbreakers: dealbreakers,
                    additional_notes: additionalNotes || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save");
            router.push(`/trip/${tripId}/status`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-16 page-transition">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
                {/* Progress bar */}
                <div className="mb-10">
                    <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-foreground mb-3">
                        <span>
                            STEP {step + 1} OF {steps.length}: {steps[step].toUpperCase()}
                        </span>
                        <span className="font-black truncate max-w-[50%]">{tripName}</span>
                    </div>
                    <div className="h-6 border-4 border-foreground bg-background p-0.5 overflow-hidden">
                        <div
                            className="h-full bg-foreground transition-all duration-500 ease-out"
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* ── Step 0: Welcome ── */}
                {step === 0 && (
                    <div className="text-center animate-fade-in">
                        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center border-4 border-foreground bg-foreground text-5xl text-background">
                            ✹
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                            HEY{userName ? `, ${userName.split(" ")[0].toUpperCase()}` : ""}
                        </h1>
                        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-foreground/70 max-w-md mx-auto">
                            LET'S FIGURE OUT YOUR DREAM TRIP. THIS TAKES ABOUT 2 MINUTES
                            — JUST TELL US WHAT YOU LOVE.
                        </p>
                        {alreadySubmitted && (
                            <div className="mt-6 border-4 border-foreground bg-background px-4 py-3 text-sm font-bold uppercase tracking-widest text-foreground">
                                ✎ YOU ALREADY SUBMITTED — EDITING PREFERENCES
                            </div>
                        )}

                        {/* Voice option */}
                        <button
                            onClick={() => setShowVoice(true)}
                            className="mt-10 w-full max-w-md mx-auto flex items-center gap-4 border-4 border-foreground bg-background p-4 text-left transition-colors hover:bg-foreground hover:text-background group"
                        >
                            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center border-4 border-foreground bg-background text-foreground text-3xl group-hover:bg-background group-hover:text-foreground transition-colors overflow-hidden">
                                ⚄
                            </div>
                            <div className="min-w-0">
                                <div className="font-black text-xl sm:text-2xl uppercase tracking-tighter group-hover:text-background truncate">PREFER TO TALK?</div>
                                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-foreground/70 group-hover:text-background/80 mt-1 line-clamp-2">TELL OUR AI ABOUT YOUR IDEAL TRIP — WE'LL FILL THE FORM FOR YOU</div>
                            </div>
                        </button>

                        <div className="mt-8 flex items-center gap-4 max-w-md mx-auto">
                            <div className="flex-1 h-1 bg-foreground" />
                            <span className="text-sm font-black uppercase tracking-widest text-foreground whitespace-nowrap">OR FILL OUT FORM</span>
                            <div className="flex-1 h-1 bg-foreground" />
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="mt-8 inline-block w-full max-w-md mx-auto border-4 border-foreground bg-foreground py-5 text-xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
                        >
                            LET'S GO ↗
                        </button>
                    </div>
                )}

                {/* Voice captured banner */}
                {voiceCaptured && step === steps.length - 1 && (
                    <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade-in">
                        🎙️ Here&apos;s what I captured from our chat — review and submit when you&apos;re ready!
                    </div>
                )}

                {/* ── Step 1: Budget ── */}
                {step === 1 && (
                    <div className="animate-fade-in space-y-8">
                        <div className="text-center border-b-4 border-foreground pb-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                ✹ WHAT'S YOUR BUDGET?
                            </h2>
                            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                TOTAL SPENDING FOR THE WHOLE TRIP (NOT PER DAY)
                            </p>
                        </div>

                        <div className="border-4 border-foreground bg-background p-8">
                            <div className="text-center mb-8">
                                <span className="text-6xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
                                    ${budget.toLocaleString()}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="200"
                                max="3000"
                                step="50"
                                value={budget}
                                onChange={(e) => setBudget(parseInt(e.target.value))}
                                className="w-full slider-thumb-brutalist"
                            />
                            <div className="flex justify-between mt-4 text-sm font-bold uppercase tracking-widest text-foreground">
                                <span>$200</span>
                                <span>$1500</span>
                                <span>$3000</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Vibes ── */}
                {step === 2 && (
                    <div className="animate-fade-in space-y-8">
                        <div className="text-center border-b-4 border-foreground pb-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                ⚑ RATE YOUR VIBES
                            </h2>
                            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                DRAG EACH SLIDER TO SHOW HOW MUCH YOU'RE INTO IT
                            </p>
                        </div>

                        <div className="space-y-4">
                            {vibes.map(({ key, emoji, label }) => (
                                <div
                                    key={key}
                                    className="border-4 border-foreground bg-background p-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="flex items-center gap-3 font-black text-lg uppercase tracking-tighter text-foreground">
                                            <span className="text-2xl">{emoji}</span> {label}
                                        </span>
                                        <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-foreground text-background text-lg font-black">
                                            {vibeRatings[key]}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={vibeRatings[key]}
                                        onChange={(e) =>
                                            setVibeRatings({
                                                ...vibeRatings,
                                                [key]: parseInt(e.target.value),
                                            })
                                        }
                                        className="w-full slider-thumb-brutalist"
                                    />
                                    <div className="flex justify-between mt-3 text-xs font-bold uppercase tracking-widest text-foreground/70">
                                        <span>MEH</span>
                                        <span>LOVE IT!</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 3: Dietary ── */}
                {step === 3 && (
                    <div className="animate-fade-in space-y-8">
                        <div className="text-center border-b-4 border-foreground pb-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                〰 DIETARY NEEDS
                            </h2>
                            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                SELECT ANY RESTRICTIONS — WE'LL MAKE SURE RESTAURANTS ACCOMMODATE YOU
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {dietaryOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        if (option === "None") {
                                            setDietary(["None"]);
                                        } else {
                                            setDietary(
                                                toggleArray(
                                                    dietary.filter((d) => d !== "None"),
                                                    option
                                                )
                                            );
                                        }
                                    }}
                                    className={`border-4 py-4 text-base font-black uppercase tracking-widest transition-colors ${dietary.includes(option)
                                        ? "border-foreground bg-foreground text-background"
                                        : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 border-t-4 border-foreground pt-6">
                            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
                                ANYTHING ELSE ABOUT FOOD? (OPTIONAL)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="E.G., I'M ALLERGIC TO SHELLFISH..."
                                value={dietaryNotes}
                                onChange={(e) => setDietaryNotes(e.target.value)}
                                className="w-full border-4 border-foreground bg-background px-4 py-4 text-lg font-bold uppercase tracking-widest text-foreground placeholder:text-foreground/30 focus:bg-foreground/5 focus:outline-none transition-colors resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* ── Step 4: Activity Preferences ── */}
                {step === 4 && (
                    <div className="animate-fade-in space-y-8">
                        <div className="text-center border-b-4 border-foreground pb-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                🏃 ACTIVITY STYLE
                            </h2>
                            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                HOW PACKED DO YOU WANT EACH DAY?
                            </p>
                        </div>

                        {/* Pace */}
                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
                                IDEAL PACE
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { value: "chill", emoji: "😌", label: "CHILL", desc: "2-3 ACTIVITIES/DAY" },
                                    { value: "moderate", emoji: "😊", label: "MODERATE", desc: "3-4 ACTIVITIES/DAY" },
                                    { value: "packed", emoji: "🤩", label: "PACKED", desc: "5+ ACTIVITIES/DAY" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setActivityLevel(option.value)}
                                        className={`border-4 p-4 text-center transition-colors ${activityLevel === option.value
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{option.emoji}</div>
                                        <div className="text-lg font-black uppercase tracking-widest">{option.label}</div>
                                        <div className={`text-xs font-bold uppercase tracking-widest mt-1 ${activityLevel === option.value ? "text-background/70" : "text-foreground/70"}`}>
                                            {option.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accommodation */}
                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
                                ACCOMMODATION PREFERENCE
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { value: "budget", emoji: "🏕️", label: "BUDGET" },
                                    { value: "mid-range", emoji: "🏨", label: "MID-RANGE" },
                                    { value: "luxury", emoji: "✨", label: "LUXURY" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setAccommodationPref(option.value)}
                                        className={`border-4 p-4 text-center transition-colors ${accommodationPref === option.value
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{option.emoji}</div>
                                        <div className="text-lg font-black uppercase tracking-widest">{option.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Must-haves */}
                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
                                MUST-HAVES ✅
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {mustHaveOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setMustHaves(toggleArray(mustHaves, option))}
                                        className={`border-4 px-4 py-2 text-sm font-black uppercase tracking-widest transition-colors ${mustHaves.includes(option)
                                            ? "border-emerald-500 bg-emerald-500 text-background"
                                            : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                                            }`}
                                    >
                                        {mustHaves.includes(option) ? "✓ " : ""}
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dealbreakers */}
                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
                                DEALBREAKERS 🚫
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {dealbreakerOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() =>
                                            setDealbreakers(toggleArray(dealbreakers, option))
                                        }
                                        className={`border-4 px-4 py-2 text-sm font-black uppercase tracking-widest transition-colors ${dealbreakers.includes(option)
                                            ? "border-red-500 bg-red-500 text-background"
                                            : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                                            }`}
                                    >
                                        {dealbreakers.includes(option) ? "✗ " : ""}
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 5: Open-ended ── */}
                {step === 5 && (
                    <div className="animate-fade-in space-y-8">
                        <div className="text-center border-b-4 border-foreground pb-6">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                💬 ANYTHING ELSE?
                            </h2>
                            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                LAST STEP! SHARE ANYTHING THE GROUP SHOULD KNOW.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-black uppercase tracking-widest text-foreground mb-4">
                                ANYTHING THE GROUP SHOULD KNOW?
                            </label>
                            <textarea
                                rows={3}
                                placeholder="E.G., I JUST WANT TO CHILL ON A BEACH AND MAYBE DO SOME HIKING"
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                className="w-full border-4 border-foreground bg-background px-4 py-4 text-lg font-bold uppercase tracking-widest text-foreground placeholder:text-foreground/30 focus:bg-foreground/5 focus:outline-none transition-colors resize-none"
                            />
                        </div>

                        {/* Summary preview */}
                        <div className="border-4 border-foreground bg-background p-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-6 border-b-4 border-foreground pb-4">
                                📋 YOUR PREFERENCE SUMMARY
                            </h3>
                            <div className="space-y-4 text-sm font-bold uppercase tracking-widest">
                                <div className="flex justify-between items-center border-b-2 border-foreground/10 pb-2">
                                    <span className="text-foreground/70">BUDGET</span>
                                    <span className="text-lg">${budget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-2 border-foreground/10 pb-2">
                                    <span className="text-foreground/70">PACE</span>
                                    <span className="text-lg uppercase">{activityLevel}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-2 border-foreground/10 pb-2">
                                    <span className="text-foreground/70">STAY</span>
                                    <span className="text-lg uppercase">{accommodationPref}</span>
                                </div>
                                <div className="flex justify-between items-center border-b-2 border-foreground/10 pb-2">
                                    <span className="text-foreground/70">TOP VIBE</span>
                                    <span className="text-lg uppercase">
                                        {
                                            vibes.find(
                                                (v) =>
                                                    vibeRatings[v.key] ===
                                                    Math.max(...Object.values(vibeRatings))
                                            )?.label
                                        }
                                    </span>
                                </div>
                                {dietary.length > 0 &&
                                    !dietary.includes("None") && (
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="text-foreground/70">DIETARY</span>
                                            <span className="text-base text-right max-w-[50%] truncate">
                                                {dietary.join(", ").toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-8 border-4 border-foreground bg-foreground px-4 py-3 text-sm font-bold uppercase tracking-widest text-background">
                        ERROR: {error}
                    </div>
                )}

                {/* Navigation buttons */}
                {step > 0 && (
                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="flex-1 border-4 border-foreground bg-background py-5 text-xl font-black uppercase tracking-tighter text-foreground transition-colors hover:bg-foreground hover:text-background"
                        >
                            ← BACK
                        </button>
                        {step < steps.length - 1 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="flex-1 border-4 border-foreground bg-foreground py-5 text-xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
                            >
                                NEXT ↗
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 border-4 border-foreground bg-foreground py-5 text-xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-pulse">SAVING...</span>
                                ) : (
                                    "SUBMIT PREFERENCES ✹"
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Voice conversation modal */}
            {showVoice && (
                <Suspense fallback={null}>
                    <VoiceConversation
                        userName={userName}
                        onComplete={handleVoiceComplete}
                        onClose={() => setShowVoice(false)}
                    />
                </Suspense>
            )}
        </div>
    );
}
