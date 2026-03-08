import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ItineraryView from "./ItineraryView";

interface ItineraryPageProps {
    params: Promise<{ tripId: string }>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
    const { tripId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    // Get trip
    const { data: trip } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

    if (!trip) {
        redirect("/dashboard");
    }

    // Get itinerary
    const { data: itinerary } = await supabase
        .from("itineraries")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (!itinerary) {
        redirect(`/trip/${tripId}/locations`);
    }

    // Get members for avatar display
    const { data: members } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId);

    const memberIds = members?.map((m) => m.user_id) || [];
    const { data: users } = await supabase
        .from("users")
        .select("id, name, avatar_url, email")
        .in("id", memberIds);

    // Fetch member budgets for comparison
    const { data: preferences } = await supabase
        .from("preferences")
        .select("user_id, budget_max")
        .eq("trip_id", tripId);

    const memberBudgets: Record<string, number> = {};
    if (preferences && users) {
        for (const pref of preferences) {
            if (pref.budget_max != null) {
                const u = users.find((u) => u.id === pref.user_id);
                const name = u?.name || u?.email?.split("@")[0] || "Unknown";
                memberBudgets[name] = pref.budget_max;
            }
        }
    }

    return (
        <ItineraryView
            trip={trip}
            itinerary={itinerary.itinerary_data}
            destination={itinerary.destination}
            members={users || []}
            memberBudgets={memberBudgets}
        />
    );
}
