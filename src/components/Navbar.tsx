"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "./ThemeProvider";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignIn = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setMenuOpen(false);
        window.location.href = "/";
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b-4 border-foreground bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-black uppercase tracking-tighter text-foreground">
                            ⚑ TRIPSYNC
                        </span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex h-9 w-9 items-center justify-center border-2 border-foreground bg-background text-foreground transition-colors hover:bg-foreground hover:text-background"
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {theme === "dark" ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {loading ? (
                            <div className="h-8 w-20 border-2 border-foreground animate-pulse" />
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center gap-2 border-2 border-foreground px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
                                >
                                    {user.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt=""
                                            width={28}
                                            height={28}
                                            className="h-7 w-7 object-cover border-2 border-foreground"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex h-7 w-7 items-center justify-center border-2 border-foreground bg-foreground text-background text-xs font-black">
                                            {(user.user_metadata?.name || user.email || "U")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <span className="hidden sm:inline text-sm font-black uppercase tracking-widest text-foreground">
                                        {user.user_metadata?.name || user.email?.split("@")[0]}
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-1 w-48 border-4 border-foreground bg-background animate-fade-in overflow-hidden">
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMenuOpen(false)}
                                            className="block px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
                                        >
                                            □ MY TRIPS
                                        </Link>
                                        <Link
                                            href="/trip/new"
                                            onClick={() => setMenuOpen(false)}
                                            className="block px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
                                        >
                                            + PLAN A TRIP
                                        </Link>
                                        <div className="border-t-2 border-foreground" />
                                        <button
                                            onClick={handleSignOut}
                                            className="block w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
                                        >
                                            SIGN OUT
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={handleSignIn}
                                className="border-4 border-foreground bg-foreground px-5 py-2 text-sm font-black uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
                            >
                                SIGN IN ↗
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
