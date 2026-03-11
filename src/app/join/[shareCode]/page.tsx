import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JoinTripClient from "./JoinTripClient";

interface JoinPageProps {
    params: Promise<{ shareCode: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
    const { shareCode } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Look up the trip
    const { data: trip } = await supabase
        .from("trips")
        .select("*")
        .eq("share_code", shareCode.toUpperCase())
        .single();

    if (!trip) {
        return (
            <div className="min-h-screen pt-24 pb-16">
                <div className="mx-auto max-w-lg px-4 text-center">
                    <div className="border-4 border-foreground bg-foreground p-8">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center border-4 border-background bg-background text-foreground text-4xl font-black">
                            ?
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-background">
                            TRIP NOT FOUND
                        </h1>
                        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-background/80">
                            THE SHARE CODE <span className="font-mono font-black text-background">{shareCode}</span> DOESN'T MATCH ANY TRIP. 
                            <br/>CHECK THE LINK AND TRY AGAIN.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Check if user is already a member
    if (user) {
        const { data: existingMember } = await supabase
            .from("trip_members")
            .select("id")
            .eq("trip_id", trip.id)
            .eq("user_id", user.id)
            .single();

        if (existingMember) {
            redirect(`/trip/${trip.id}/preferences`);
        }
    }

    return <JoinTripClient trip={trip} user={user} shareCode={shareCode} />;
}
