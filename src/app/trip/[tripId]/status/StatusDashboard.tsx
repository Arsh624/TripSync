"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface MemberWithInfo {
    id: string;
    trip_id: string;
    user_id: string;
    has_submitted: boolean;
    joined_at: string;
    user: {
        id: string;
        name: string;
        avatar_url: string | null;
        email: string;
    };
}

interface StatusDashboardProps {
    trip: {
        id: string;
        name: string;
        leader_id: string;
        share_code: string;
        status: string;
        destination: string | null;
        start_date: string | null;
        end_date: string | null;
        trip_duration_days: number | null;
        group_size: number | null;
    };
    initialMembers: MemberWithInfo[];
    isLeader: boolean;
    currentUserId: string;
}

export default function StatusDashboard({
    trip,
    initialMembers,
    isLeader,
    currentUserId,
}: StatusDashboardProps) {
    const router = useRouter();
    const [members, setMembers] = useState<MemberWithInfo[]>(initialMembers);
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/join/${trip.share_code}`
        : `/join/${trip.share_code}`;

    const submittedCount = members.filter((m) => m.has_submitted).length;
    const allSubmitted = members.length > 0 && submittedCount === members.length;

    // Realtime subscription for trip_members changes
    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel(`trip-status-${trip.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "trip_members",
                    filter: `trip_id=eq.${trip.id}`,
                },
                async () => {
                    const { data: updatedMembers } = await supabase
                        .from("trip_members")
                        .select("*")
                        .eq("trip_id", trip.id);

                    if (updatedMembers) {
                        const memberIds = updatedMembers.map((m) => m.user_id);
                        const { data: users } = await supabase
                            .from("users")
                            .select("id, name, avatar_url, email")
                            .in("id", memberIds);

                        const withInfo = updatedMembers.map((m) => {
                            const u = users?.find((u) => u.id === m.user_id);
                            return {
                                ...m,
                                user: u
                                    ? { ...u, name: u.name || u.email?.split("@")[0] || "Member" }
                                    : {
                                        id: m.user_id,
                                        name: "Member",
                                        avatar_url: null,
                                        email: "",
                                    },
                            };
                        });

                        setMembers(withInfo);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [trip.id]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = shareUrl;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentMember = members.find((m) => m.user_id === currentUserId);

    return (
        <div className="min-h-screen pt-24 pb-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
                {/* Header */}
                <div className="text-center border-b-4 border-foreground pb-8">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground leading-none">
                        {trip.name}
                    </h1>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {trip.trip_duration_days && (
                            <span className="border-2 border-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground">
                                □ {trip.trip_duration_days} DAYS
                            </span>
                        )}
                        {trip.group_size && (
                            <span className="border-2 border-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground">
                                □ {trip.group_size} TRAVELERS
                            </span>
                        )}
                        {trip.destination && (
                            <span className="border-2 border-foreground bg-foreground px-4 py-2 text-xs font-black uppercase tracking-widest text-background">
                                ⌖ {trip.destination.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Share Link Card */}
                <div className="mt-8 border-4 border-foreground bg-background p-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                        SHARE THIS LINK WITH YOUR CREW
                    </h3>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 border-2 border-foreground bg-background px-4 py-3 font-mono text-sm text-foreground select-all overflow-x-auto">
                            {shareUrl}
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`shrink-0 border-4 px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors ${
                                copied
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                            }`}
                        >
                            {copied ? "✓ COPIED" : "COPY"}
                        </button>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-widest text-foreground/60">
                        CODE: <span className="font-mono font-black text-foreground">{trip.share_code}</span>
                    </p>
                </div>

                {/* Team Progress */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                            TEAM PROGRESS
                        </h2>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/60">
                            {submittedCount}/{members.length} SUBMITTED
                        </span>
                    </div>
                    <div className="h-6 border-4 border-foreground bg-background overflow-hidden">
                        <div
                            className="h-full bg-foreground transition-all duration-700 ease-out"
                            style={{
                                width: `${members.length > 0 ? (submittedCount / members.length) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Members List */}
                <div className="mt-6 space-y-3">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-4 border-4 border-foreground bg-background p-4"
                        >
                            {/* Avatar */}
                            {member.user.avatar_url ? (
                                <img
                                    src={member.user.avatar_url}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 object-cover border-2 border-foreground"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-foreground text-background font-black text-sm">
                                    {member.user.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black uppercase tracking-tighter text-foreground truncate">
                                        {member.user.name}
                                    </span>
                                    {member.user_id === trip.leader_id && (
                                        <span className="shrink-0 border-2 border-foreground bg-foreground text-background px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                                            ✹ LEADER
                                        </span>
                                    )}
                                    {member.user_id === currentUserId && (
                                        <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-foreground/50">(YOU)</span>
                                    )}
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 truncate mt-0.5">
                                    {member.user.email}
                                </p>
                            </div>

                            {/* Status */}
                            <div className="shrink-0">
                                {member.has_submitted ? (
                                    <span className="border-2 border-foreground bg-foreground px-3 py-1 text-xs font-black uppercase tracking-widest text-background">
                                        ✓ DONE
                                    </span>
                                ) : (
                                    <span className="border-2 border-foreground bg-background px-3 py-1 text-xs font-black uppercase tracking-widest text-foreground">
                                        ◗ PENDING
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Empty slots */}
                    {trip.group_size &&
                        members.length < trip.group_size &&
                        Array.from({ length: trip.group_size - members.length }).map(
                            (_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="flex items-center gap-4 border-4 border-dashed border-foreground/30 bg-background p-4"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center border-2 border-dashed border-foreground/30 text-foreground/30 font-black">
                                        ?
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-foreground/40">
                                        WAITING FOR SOMEONE TO JOIN...
                                    </span>
                                </div>
                            )
                        )}
                </div>

                {/* Fill in preferences CTA */}
                {currentMember && !currentMember.has_submitted && (
                    <div className="mt-8">
                        <Link
                            href={`/trip/${trip.id}/preferences`}
                            className="block w-full border-4 border-foreground bg-background py-5 text-center text-xl font-black uppercase tracking-tighter text-foreground transition-colors hover:bg-foreground hover:text-background"
                        >
                            FILL IN YOUR PREFERENCES ↗
                        </Link>
                    </div>
                )}

                {/* All submitted — Generate Plan */}
                {allSubmitted && (
                    <div className="mt-8 border-4 border-foreground bg-background p-6 text-center animate-fade-in">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-4 border-foreground bg-foreground text-background text-3xl font-black">
                            ✹
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                            ALL PREFERENCES IN
                        </h3>
                        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                            EVERYONE&apos;S SUBMITTED. TIME TO LET THE AI WORK.
                        </p>
                        {isLeader ? (
                            trip.destination ? (
                                <GenerateDirectButton tripId={trip.id} destination={trip.destination} />
                            ) : (
                                <Link
                                    href={`/trip/${trip.id}/locations`}
                                    className="mt-6 inline-block border-4 border-foreground bg-foreground px-10 py-4 text-lg font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
                                >
                                    GENERATE PLAN ↗
                                </Link>
                            )
                        ) : (
                            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-foreground/60">
                                THE TRIP LEADER WILL GENERATE THE PLAN SOON.
                            </p>
                        )}
                    </div>
                )}

                {/* Not all submitted yet */}
                {!allSubmitted && members.length > 0 && (
                    <div className="mt-6 text-center">
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground/60">
                            ◗ WAITING FOR{" "}
                            <span className="font-black text-foreground">
                                {members.length - submittedCount} MORE
                            </span>{" "}
                            {members.length - submittedCount === 1 ? "PERSON" : "PEOPLE"} TO SUBMIT
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/** Button that skips location recommendations when destination is already set */
function GenerateDirectButton({ tripId, destination }: { tripId: string; destination: string }) {
    const router = useRouter();
    const [phase, setPhase] = useState<"idle" | "synthesizing" | "generating" | "error">("idle");
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setPhase("synthesizing");
        setError("");

        try {
            const synthRes = await fetch(`/api/trips/${tripId}/synthesize`, { method: "POST" });
            const synthData = await synthRes.json();
            if (!synthRes.ok) throw new Error(synthData.error);

            setPhase("generating");
            const itinRes = await fetch(`/api/trips/${tripId}/generate-itinerary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, synthesis: synthData.synthesis }),
            });
            const itinData = await itinRes.json();
            if (!itinRes.ok) throw new Error(itinData.error);

            router.push(`/trip/${tripId}/itinerary`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setPhase("error");
        }
    };

    if (phase === "synthesizing" || phase === "generating") {
        return (
            <div className="mt-6">
                <div className="inline-flex items-center gap-2 border-4 border-foreground bg-foreground px-8 py-4 text-base font-black uppercase tracking-tighter text-background animate-pulse">
                    {phase === "synthesizing" ? "ANALYZING PREFERENCES..." : `BUILDING ${destination.toUpperCase()} ITINERARY...`}
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-foreground/50">PLEASE BE PATIENT, THIS MAY TAKE A WHILE</p>
            </div>
        );
    }

    if (phase === "error") {
        return (
            <div className="mt-6">
                <p className="text-sm font-bold uppercase tracking-widest text-foreground mb-3 border-4 border-foreground p-3">{error}</p>
                <button
                    onClick={handleGenerate}
                    className="border-4 border-foreground bg-background px-8 py-4 text-base font-black uppercase tracking-tighter text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                    TRY AGAIN ←
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleGenerate}
            className="mt-6 border-4 border-foreground bg-foreground px-10 py-4 text-lg font-black uppercase tracking-tighter text-background transition-colors hover:bg-background hover:text-foreground"
        >
            GENERATE PLAN FOR {destination.toUpperCase()} ↗
        </button>
    );
}
