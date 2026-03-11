"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface JoinTripClientProps {
    trip: {
        id: string;
        name: string;
        leader_id: string;
        trip_duration_days: number | null;
        group_size: number | null;
        destination: string | null;
        start_date: string | null;
        end_date: string | null;
    };
    user: User | null;
    shareCode: string;
}

export default function JoinTripClient({
    trip,
    user,
    shareCode,
}: JoinTripClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignIn = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/join/${shareCode}`,
            },
        });
    };

    const handleJoin = async () => {
        if (!user) return;
        setLoading(true);
        setError("");

        try {
            const supabase = createClient();

            // Ensure user exists in users table
            const { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .eq("id", user.id)
                .single();

            if (!existingUser) {
                await supabase.from("users").insert({
                    id: user.id,
                    email: user.email!,
                    name: user.user_metadata?.name || user.email!.split("@")[0],
                    avatar_url: user.user_metadata?.avatar_url || null,
                });
            }

            // Join the trip
            const { error: joinError } = await supabase
                .from("trip_members")
                .insert({
                    trip_id: trip.id,
                    user_id: user.id,
                    has_submitted: false,
                });

            if (joinError) {
                if (joinError.code === "23505") {
                    // Already a member
                    router.push(`/trip/${trip.id}/preferences`);
                    return;
                }
                throw joinError;
            }

            router.push(`/trip/${trip.id}/preferences`);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Failed to join trip"
            );
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-16">
            <div className="mx-auto max-w-lg px-4">
                <div className="border-4 border-foreground bg-background p-8 text-center">
                    {/* Trip invite header */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border-4 border-foreground bg-foreground text-4xl text-background">
                        ⚑
                    </div>

                    <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
                        YOU'RE INVITED TO
                    </p>
                    <h1 className="mt-2 text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                        {trip.name}
                    </h1>

                    {/* Trip details */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {trip.trip_duration_days && (
                            <span className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-3 py-1 text-sm font-bold uppercase tracking-widest text-background">
                                ◷ {trip.trip_duration_days} DAYS
                            </span>
                        )}
                        {trip.group_size && (
                            <span className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-3 py-1 text-sm font-bold uppercase tracking-widest text-foreground">
                                ⚑ {trip.group_size} TRAVELERS
                            </span>
                        )}
                        {trip.destination && (
                            <span className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-3 py-1 text-sm font-bold uppercase tracking-widest text-foreground">
                                ✹ {trip.destination}
                            </span>
                        )}
                        {trip.start_date && (
                            <span className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-3 py-1 text-sm font-bold uppercase tracking-widest text-foreground">
                                🗓 {new Date(trip.start_date).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-8 border-4 border-foreground bg-foreground px-4 py-3 text-sm font-bold uppercase tracking-widest text-background">
                            ERROR: {error}
                        </div>
                    )}

                    {/* Action */}
                    <div className="mt-10">
                        {user ? (
                            <button
                                onClick={handleJoin}
                                disabled={loading}
                                className="w-full border-4 border-foreground bg-foreground py-5 text-xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-pulse">
                                        JOINING...
                                    </span>
                                ) : (
                                    "JOIN THIS TRIP ↗"
                                )}
                            </button>
                        ) : (
                            <div className="border-t-4 border-foreground pt-8 mt-4">
                                <p className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                    SIGN IN TO JOIN AND SHARE PREFERENCES
                                </p>
                                <button
                                    onClick={handleSignIn}
                                    className="w-full border-4 border-foreground bg-foreground py-5 text-xl font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
                                >
                                    SIGN IN WITH GOOGLE ↗
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
