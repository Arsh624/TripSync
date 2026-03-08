import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Get current user's display name
    const { data: currentUser } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", user.id)
        .single();

    const userName =
        currentUser?.name || currentUser?.email?.split("@")[0] || "Unknown";

    // Fetch trips the user is a member of
    const { data: memberships } = await supabase
        .from("trip_members")
        .select("trip_id, has_submitted")
        .eq("user_id", user.id);

    let trips: Array<{
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
        created_at: string;
        is_leader: boolean;
        has_submitted: boolean;
        member_count: number;
        submitted_count: number;
        my_estimated_cost: number | null;
    }> = [];

    if (memberships && memberships.length > 0) {
        const tripIds = memberships.map((m) => m.trip_id);
        const { data: tripData } = await supabase
            .from("trips")
            .select("*")
            .in("id", tripIds)
            .order("created_at", { ascending: false });

        if (tripData) {
            // Get all members with submission status for each trip
            const { data: allMembers } = await supabase
                .from("trip_members")
                .select("trip_id, has_submitted")
                .in("trip_id", tripIds);

            const memberCounts: Record<string, number> = {};
            const submittedCounts: Record<string, number> = {};
            allMembers?.forEach((m) => {
                memberCounts[m.trip_id] = (memberCounts[m.trip_id] || 0) + 1;
                if (m.has_submitted) {
                    submittedCounts[m.trip_id] = (submittedCounts[m.trip_id] || 0) + 1;
                }
            });

            // Fetch itineraries for complete trips to get the user's cost
            const completeTripIds = tripData
                .filter((t) => t.status === "complete")
                .map((t) => t.id);

            const userCosts: Record<string, number | null> = {};
            if (completeTripIds.length > 0) {
                const { data: itineraries } = await supabase
                    .from("itineraries")
                    .select("trip_id, itinerary_data")
                    .in("trip_id", completeTripIds);

                if (itineraries) {
                    for (const itin of itineraries) {
                        const perPerson = itin.itinerary_data?.budget_summary?.per_person;
                        if (!perPerson) continue;
                        // Find user's entry (exact then case-insensitive)
                        let myBudget = perPerson[userName];
                        if (!myBudget) {
                            const key = Object.keys(perPerson).find(
                                (k) => k.toLowerCase() === userName.toLowerCase()
                            );
                            if (key) myBudget = perPerson[key];
                        }
                        if (myBudget?.total != null) {
                            userCosts[itin.trip_id] = myBudget.total;
                        }
                    }
                }
            }

            trips = tripData.map((trip) => ({
                ...trip,
                is_leader: trip.leader_id === user.id,
                has_submitted:
                    memberships.find((m) => m.trip_id === trip.id)?.has_submitted ?? false,
                member_count: memberCounts[trip.id] || 0,
                submitted_count: submittedCounts[trip.id] || 0,
                my_estimated_cost: userCosts[trip.id] ?? null,
            }));
        }
    }

    const statusColors: Record<string, string> = {
        collecting:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/40",
        ready:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-500/40",
        planning:
            "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-500/40",
        complete:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/40",
    };

    const statusLabels: Record<string, string> = {
        collecting: "Collecting Preferences",
        ready: "Ready to Plan",
        planning: "AI Planning",
        complete: "Trip Planned!",
    };

    return (
        <div className="min-h-screen pt-24 pb-16 page-transition">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Trips</h1>
                        <p className="mt-1 text-muted">
                            Plan, join, and manage your group adventures
                        </p>
                    </div>
                    <Link
                        href="/trip/new"
                        className="inline-flex items-center gap-2 rounded-full gradient-bg px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                    >
                        <span className="text-lg">+</span> Plan a Trip
                    </Link>
                </div>

                {trips.length === 0 ? (
                    /* Empty state */
                    <div className="mt-16 flex flex-col items-center justify-center text-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-50 text-5xl">
                            ✈️
                        </div>
                        <h2 className="mt-6 text-xl font-semibold text-foreground">
                            No trips yet
                        </h2>
                        <p className="mt-2 max-w-sm text-muted">
                            Start planning your first group trip or join one using a share code
                            from a friend.
                        </p>
                        <Link
                            href="/trip/new"
                            className="mt-6 inline-flex items-center gap-2 rounded-full gradient-bg px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                        >
                            Plan Your First Trip 🚀
                        </Link>
                    </div>
                ) : (
                    /* Trip cards */
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {trips.map((trip) => {
                            const isComplete = trip.status === "complete";
                            const isCollecting = trip.status === "collecting";

                            const cardHref = isComplete
                                ? `/trip/${trip.id}/itinerary`
                                : trip.is_leader
                                    ? `/trip/${trip.id}/status`
                                    : trip.has_submitted
                                        ? `/trip/${trip.id}/status`
                                        : `/trip/${trip.id}/preferences`;

                            // Format dates for complete trips
                            const formatDate = (d: string | null) => {
                                if (!d) return null;
                                return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                });
                            };

                            return (
                                <div
                                    key={trip.id}
                                    className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary-light hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <Link
                                                href={cardHref}
                                                className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors"
                                            >
                                                {trip.name}
                                            </Link>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[trip.status] || statusColors.collecting}`}
                                                >
                                                    {statusLabels[trip.status] || trip.status}
                                                </span>
                                                {trip.is_leader && (
                                                    <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-500/40">
                                                        👑 Leader
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={cardHref}>
                                            <svg
                                                className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </Link>
                                    </div>

                                    {/* Info row */}
                                    <div className="mt-4 flex items-center gap-4 text-sm text-muted">
                                        <span className="flex items-center gap-1">
                                            👥 {trip.member_count}
                                            {trip.group_size ? ` / ${trip.group_size}` : ""} travelers
                                        </span>
                                        {trip.trip_duration_days && (
                                            <span className="flex items-center gap-1">
                                                📅 {trip.trip_duration_days} days
                                            </span>
                                        )}
                                    </div>

                                    {trip.destination && (
                                        <div className="mt-2 text-sm text-muted">
                                            📍 {trip.destination}
                                        </div>
                                    )}

                                    {/* Complete trip summary */}
                                    {isComplete && (
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    {trip.start_date && trip.end_date && (
                                                        <p className="text-xs text-muted">
                                                            🗓️ {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                                                        </p>
                                                    )}
                                                    {trip.my_estimated_cost != null && (
                                                        <p className="text-lg font-bold gradient-text mt-1">
                                                            ${trip.my_estimated_cost.toLocaleString()}
                                                            <span className="text-xs font-normal text-muted ml-1">
                                                                your est. cost
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/trip/${trip.id}/itinerary`}
                                                    className="rounded-lg gradient-bg px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all"
                                                >
                                                    View Itinerary →
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Collecting status: show submission progress */}
                                    {isCollecting && (
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-muted">Preferences submitted</span>
                                                <span className="text-xs font-semibold text-foreground">
                                                    {trip.submitted_count} / {trip.member_count}
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-border overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                                    style={{
                                                        width: `${trip.member_count > 0 ? (trip.submitted_count / trip.member_count) * 100 : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            {trip.submitted_count === trip.member_count && trip.member_count > 0 && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                                                    ✅ Everyone&apos;s in — ready to plan!
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
