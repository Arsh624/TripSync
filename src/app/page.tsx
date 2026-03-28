"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const features = [
  {
    icon: "✺",
    title: "AI MATCHING",
    description: "WE ANALYZE VIBES, BUDGETS, AND DIETS. NO DEBATES.",
  },
  {
    icon: "〰",
    title: "VOICE INPUT",
    description: "DON'T TYPE. JUST TALK. WE EXTRACT THE PREFERENCES.",
  },
  {
    icon: "⚄",
    title: "SMART PLANS",
    description: "DAY-BY-DAY ITINERARIES. SOLO TIME INCLUDED. BUDGETS BROKEN DOWN.",
  },
  {
    icon: "↗",
    title: "GROUP SYNC",
    description: "SHARE ONE LINK. SECURE EVERYONE'S INPUT IN REAL-TIME.",
  },
];

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
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

  return (
    <div className="h-[calc(100vh-64px)] mt-[64px] snap-y snap-mandatory overflow-y-auto overflow-x-hidden bg-background">
      
      {/* 1. HERO SECTION */}
      <section className="h-[calc(100vh-64px)] w-full snap-start flex flex-col md:flex-row border-b-2 border-foreground">
        
        {/* Left: Massive Typography */}
        <div className="flex-1 border-b-2 md:border-b-0 md:border-r-2 border-foreground flex items-center p-8 lg:p-16">
          <h1 className="font-black uppercase text-[12vw] md:text-[8vw] leading-[0.85] tracking-tighter text-foreground break-words hyphen-auto">
            TRIPS<br/>YOUR<br/>CREW<br/>WILL LOVE.
          </h1>
        </div>

        {/* Right: CTA & Powered By */}
        <div className="flex-1 flex flex-col">
          {user ? (
            <Link
              href="/trip/new"
              className="group flex-1 flex flex-col justify-center items-center bg-foreground text-background transition-colors hover:bg-background hover:text-foreground cursor-pointer border-b-2 border-foreground p-8"
            >
              <span className="font-black uppercase text-5xl md:text-7xl tracking-tighter text-center">
                PLAN<br />TRIP ↗
              </span>
            </Link>
          ) : (
            <button
              onClick={handleSignIn}
              className="group flex-1 flex flex-col justify-center items-center bg-foreground text-background transition-colors hover:bg-background hover:text-foreground cursor-pointer border-b-2 border-foreground p-8 w-full"
            >
              <span className="font-black uppercase text-4xl lg:text-5xl xl:text-7xl tracking-tighter text-center">
                GET STARTED<br />IT&apos;S FREE ↗
              </span>
            </button>
          )}

          <div className="h-1/3 min-h-[150px] bg-background flex flex-col justify-center p-8 gap-4 border-t-2 border-foreground group hover:bg-foreground hover:text-background transition-colors">
            <p className="font-black tracking-widest text-xs uppercase opacity-50">POWERED BY</p>
            <div className="flex flex-col gap-2 font-black uppercase tracking-tighter text-2xl md:text-3xl">
              <span>✺ GEMINI AI</span>
              <span>〰 ELEVENLABS</span>
              <span>◩ VULTR CLOUD</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE ARSENAL (Features Carousel) */}
      <section className="h-[calc(100vh-64px)] w-full snap-start flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-foreground p-6 md:p-12 shrink-0">
          <h2 className="font-black uppercase text-4xl md:text-6xl tracking-tighter">
            [ THE ARSENAL ]
          </h2>
        </div>

        {/* Carousel Content */}
        <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
          
          {/* Active Feature Display */}
          <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 border-b-2 md:border-b-0 md:border-r-2 border-foreground bg-background">
            <div className="text-[120px] md:text-[200px] leading-none text-foreground mb-8 animate-fade-in">
              {features[activeFeature].icon}
            </div>
            <h3 className="font-black uppercase text-5xl md:text-7xl xl:text-8xl tracking-tighter leading-none mb-6 text-foreground break-words animate-fade-in">
              {features[activeFeature].title}
            </h3>
            <p className="font-bold text-lg md:text-2xl uppercase tracking-widest max-w-2xl text-foreground/80 animate-fade-in">
              {features[activeFeature].description}
            </p>
          </div>

          {/* Indicators / Progress */}
          <div className="w-full md:w-32 lg:w-48 xl:w-64 bg-foreground flex flex-row md:flex-col shrink-0">
            {features.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 border-r-2 md:border-r-0 md:border-b-2 border-background transition-colors cursor-pointer flex items-center justify-center
                  ${activeFeature === idx ? "bg-background text-foreground" : "bg-foreground text-background"}`}
                onClick={() => setActiveFeature(idx)}
              >
                <span className="font-black text-2xl md:text-4xl tracking-tighter">
                  0{idx + 1}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>
      
      {/* 3. FOOTER */}
      <footer className="h-[calc(40vh)] snap-start border-t-2 border-foreground bg-foreground text-background flex flex-col items-center justify-center p-8">
        <h2 className="font-black uppercase text-[8vw] leading-none tracking-tighter text-center mb-8">
          TRIPSYNC
        </h2>
        <div className="flex flex-col md:flex-row gap-8 font-black uppercase tracking-widest text-sm text-center">
          <span>TRAVEL SMARTER, TOGETHER</span>
          <span className="hidden md:inline">|</span>
          <span>NO MORE ENDLESS GROUP CHATS</span>
        </div>
      </footer>

    </div>
  );
}
