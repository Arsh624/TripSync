import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BudgetDashboard from "./BudgetDashboard";

interface BudgetPageProps {
    params: Promise<{ tripId: string }>;
}

export default async function BudgetPage({ params }: BudgetPageProps) {
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

    // Get current user's display name
    const { data: currentUser } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", user.id)
        .single();

    const userName =
        currentUser?.name || currentUser?.email?.split("@")[0] || "Unknown";

    // Get the user's stated budget from preferences
    const { data: userPref } = await supabase
        .from("preferences")
        .select("budget_max")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .single();

    const statedBudget = userPref?.budget_max ?? null;

    // Extract budget data
    const budgetSummary = itinerary.itinerary_data?.budget_summary;
    const perPerson = budgetSummary?.per_person || {};
    const groupTotal = budgetSummary?.group_total ?? null;

    // Find the current user's budget entry (exact match, then case-insensitive fallback)
    let myBudget = perPerson[userName];
    if (!myBudget) {
        const key = Object.keys(perPerson).find(
            (k) => k.toLowerCase() === userName.toLowerCase()
        );
        if (key) myBudget = perPerson[key];
    }

    return (
        <BudgetDashboard
            tripId={tripId}
            tripName={trip.name}
            destination={itinerary.destination}
            userName={userName}
            myBudget={
                myBudget
                    ? {
                          total: myBudget.total ?? 0,
                          accommodation: myBudget.accommodation ?? 0,
                          food: myBudget.food ?? 0,
                          activities: myBudget.activities ?? 0,
                          transportation: myBudget.transportation ?? 0,
                          savings_tips: myBudget.savings_tips ?? null,
                      }
                    : null
            }
            statedBudget={statedBudget}
            groupTotal={groupTotal}
            memberCount={Object.keys(perPerson).length}
        />
    );
}
