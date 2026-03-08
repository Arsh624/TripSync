import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

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

    return <DashboardClient trips={trips} />;
}
