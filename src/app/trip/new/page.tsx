"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTripPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        origin_city: "",
        hasDestination: false,
        destination: "",
        dateFlexibility: "flexible" as "flexible" | "specific",
        start_date: "",
        end_date: "",
        trip_duration_days: 4,
        group_size: 4,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/trips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    origin_city: formData.origin_city || null,
                    destination: formData.hasDestination ? formData.destination : null,
                    start_date:
                        formData.dateFlexibility === "specific"
                            ? formData.start_date
                            : null,
                    end_date:
                        formData.dateFlexibility === "specific" ? formData.end_date : null,
                    trip_duration_days: formData.trip_duration_days,
                    group_size: formData.group_size,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create trip");
            }

            router.push(`/trip/${data.trip.id}/status`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-16 bg-background">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
                
                {/* Header */}
                <div className="border-b-4 border-foreground pb-6 mb-8">
                    <div className="text-4xl mb-3 text-foreground">
                        ⚑
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground leading-none">
                        PLAN<br/>A TRIP
                    </h1>
                    <p className="mt-2 text-base font-bold uppercase tracking-widest text-foreground/70">
                        SET UP THE BASICS. WE'LL HANDLE THE REST.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Trip Name */}
                    <div className="space-y-3">
                        <label className="block text-xl font-black uppercase tracking-tighter text-foreground">
                            WHAT SHOULD WE CALL THIS TRIP?
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="E.G., SUMMER ROAD TRIP 2026"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full border-4 border-foreground bg-background px-4 py-3 text-lg font-bold uppercase text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-foreground focus:text-background transition-colors"
                        />
                    </div>

                    {/* Origin City */}
                    <div className="space-y-3">
                        <label className="block text-xl font-black uppercase tracking-tighter text-foreground">
                            WHERE ARE YOU TRAVELING FROM?
                        </label>
                        <p className="text-xs font-bold tracking-widest uppercase text-foreground/50">USED FOR LOGISTICS AND COST ESTIMATES</p>
                        <input
                            type="text"
                            placeholder="E.G., DENVER, CO"
                            value={formData.origin_city}
                            onChange={(e) =>
                                setFormData({ ...formData, origin_city: e.target.value })
                            }
                            className="w-full border-4 border-foreground bg-background px-4 py-3 text-lg font-bold uppercase text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-foreground focus:text-background transition-colors"
                        />
                    </div>

                    {/* Group Size */}
                    <div className="space-y-3 border-t-4 border-foreground pt-8">
                        <label className="block text-xl font-black uppercase tracking-tighter text-foreground">
                            HOW MANY TRAVELERS?
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="2"
                                max="12"
                                value={formData.group_size}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        group_size: parseInt(e.target.value),
                                    })
                                }
                                className="flex-1 appearance-none bg-foreground h-2 outline-none slider-thumb-brutalist"
                            />
                            <span className="flex h-12 w-12 items-center justify-center border-4 border-foreground bg-foreground text-2xl font-black text-background">
                                {formData.group_size}
                            </span>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3 border-t-4 border-foreground pt-8">
                        <label className="block text-xl font-black uppercase tracking-tighter text-foreground">
                            TRIP DURATION (DAYS)
                        </label>
                        <div className="grid grid-cols-5 border-4 border-foreground">
                            {[3, 4, 5, 6, 7].map((days, idx) => (
                                <button
                                    key={days}
                                    type="button"
                                    onClick={() =>
                                        setFormData({ ...formData, trip_duration_days: days })
                                    }
                                    className={`py-4 text-center text-2xl font-black transition-colors ${idx !== 4 ? 'border-r-4 border-foreground' : ''} ${
                                        formData.trip_duration_days === days
                                            ? "bg-foreground text-background"
                                            : "bg-background text-foreground hover:bg-foreground/10"
                                    }`}
                                >
                                    {days}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Flexibility */}
                    <div className="space-y-3 border-t-4 border-foreground pt-8">
                        <label className="block text-xl font-black uppercase tracking-tighter text-foreground">
                            WHEN ARE YOU GOING?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, dateFlexibility: "flexible" })
                                }
                                className={`border-4 border-foreground p-4 text-left transition-colors flex flex-col justify-between min-h-[120px] ${
                                    formData.dateFlexibility === "flexible"
                                        ? "bg-foreground text-background"
                                        : "bg-background text-foreground hover:bg-foreground/10"
                                }`}
                            >
                                <div className="text-3xl mb-3">〰</div>
                                <div className="font-black text-xl uppercase tracking-tighter">WE'RE FLEXIBLE</div>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, dateFlexibility: "specific" })
                                }
                                className={`border-4 border-foreground p-4 text-left transition-colors flex flex-col justify-between min-h-[120px] ${
                                    formData.dateFlexibility === "specific"
                                        ? "bg-foreground text-background"
                                        : "bg-background text-foreground hover:bg-foreground/10"
                                }`}
                            >
                                <div className="text-3xl mb-3">⚄</div>
                                <div className="font-black text-xl uppercase tracking-tighter">SPECIFIC DATES</div>
                            </button>
                        </div>

                        {formData.dateFlexibility === "specific" && (
                            <div className="mt-4 grid grid-cols-2 gap-4 animate-fade-in bg-foreground p-4 text-background">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-background/70">
                                        START DATE
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, start_date: e.target.value })
                                        }
                                        className="w-full border-none bg-background px-3 py-3 text-base font-bold uppercase text-foreground focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-background/70">
                                        END DATE
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, end_date: e.target.value })
                                        }
                                        className="w-full border-none bg-background px-3 py-3 text-base font-bold uppercase text-foreground focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Destination Toggle */}
                    <div className="space-y-3 border-t-4 border-foreground pt-8">
                        <label className="block text-xl font-black uppercase tracking-tighter text-foreground">
                            ALREADY HAVE A DESTINATION?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, hasDestination: false })
                                }
                                className={`border-4 border-foreground p-4 text-left transition-colors flex flex-col justify-between min-h-[120px] ${
                                    !formData.hasDestination
                                        ? "bg-foreground text-background"
                                        : "bg-background text-foreground hover:bg-foreground/10"
                                }`}
                            >
                                <div className="text-3xl mb-3">✺</div>
                                <div>
                                    <div className="font-black text-xl uppercase tracking-tighter">AI WILL SUGGEST</div>
                                    <div className="text-xs font-bold tracking-widest uppercase opacity-50 mt-1">
                                        BASED ON GROUP PREFS
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, hasDestination: true })
                                }
                                className={`border-4 border-foreground p-4 text-left transition-colors flex flex-col justify-between min-h-[120px] ${
                                    formData.hasDestination
                                        ? "bg-foreground text-background"
                                        : "bg-background text-foreground hover:bg-foreground/10"
                                }`}
                            >
                                <div className="text-3xl mb-3">↗</div>
                                <div>
                                    <div className="font-black text-xl uppercase tracking-tighter">WE KNOW WHERE</div>
                                    <div className="text-xs font-bold tracking-widest uppercase opacity-50 mt-1">
                                        ENTER BELOW
                                    </div>
                                </div>
                            </button>
                        </div>

                        {formData.hasDestination && (
                            <div className="mt-4 animate-fade-in">
                                <input
                                    type="text"
                                    placeholder="E.G., SAVANNAH, GA"
                                    value={formData.destination}
                                    onChange={(e) =>
                                        setFormData({ ...formData, destination: e.target.value })
                                    }
                                    className="w-full border-4 border-foreground bg-background px-4 py-3 text-lg font-bold uppercase text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-foreground focus:text-background transition-colors"
                                />
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="border-4 border-foreground bg-foreground px-4 py-3 text-base font-bold uppercase text-background">
                            ERROR: {error}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="w-full border-4 border-foreground bg-foreground py-5 text-2xl sm:text-3xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    CREATING...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-4">
                                    INITIALIZE TRIP <span className="group-hover:translate-x-4 transition-transform">↗</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
