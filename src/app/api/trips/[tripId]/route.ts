import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the trip exists and the user is the leader
    const { data: trip } = await supabase
        .from("trips")
        .select("id, leader_id, name")
        .eq("id", tripId)
        .single();

    if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.leader_id !== user.id) {
        return NextResponse.json(
            { error: "Only the trip leader can delete a trip" },
            { status: 403 }
        );
    }

    // Use service role client to bypass RLS for cascade deletion
    const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete in foreign-key-safe order
    const tables = [
        "itineraries",
        "location_recommendations",
        "trip_synthesis",
        "preferences",
        "trip_members",
    ];

    for (const table of tables) {
        const { error } = await serviceClient
            .from(table)
            .delete()
            .eq("trip_id", tripId);

        // Ignore "relation does not exist" errors (e.g. trip_synthesis may not exist)
        if (error && !error.message.includes("does not exist")) {
            console.error(`Delete ${table} error:`, error);
            return NextResponse.json(
                { error: `Failed to delete ${table}: ${error.message}` },
                { status: 500 }
            );
        }
    }

    // Finally delete the trip itself
    const { error: tripError } = await serviceClient
        .from("trips")
        .delete()
        .eq("id", tripId);

    if (tripError) {
        console.error("Delete trip error:", tripError);
        return NextResponse.json(
            { error: `Failed to delete trip: ${tripError.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
