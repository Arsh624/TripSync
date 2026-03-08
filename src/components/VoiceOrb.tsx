"use client";

import { useRef, useEffect, useCallback } from "react";

interface VoiceOrbProps {
    phase: "idle" | "speaking" | "listening" | "processing" | "done";
    audioElement?: HTMLAudioElement | null;
}

export default function VoiceOrb({ phase, audioElement }: VoiceOrbProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const amplitudeRef = useRef(0);
    const timeRef = useRef(0);

    // Connect AudioContext to the audio element for real-time amplitude
    useEffect(() => {
        if (audioElement && phase === "speaking") {
            try {
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new AudioContext();
                }
                const ctx = audioCtxRef.current;

                if (!sourceRef.current) {
                    const source = ctx.createMediaElementSource(audioElement);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    analyser.connect(ctx.destination);
                    sourceRef.current = source;
                    analyserRef.current = analyser;
                }
            } catch (e) {
                // AudioContext might already be connected
                console.log("[VoiceOrb] AudioContext setup:", e);
            }
        }
    }, [audioElement, phase]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        timeRef.current += 0.02;

        // Get audio amplitude if analyser available
        let amplitude = 0;
        if (analyserRef.current && phase === "speaking") {
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            const sum = data.reduce((a, b) => a + b, 0);
            amplitude = sum / data.length / 255;
        }
        // Smooth amplitude
        amplitudeRef.current += (amplitude - amplitudeRef.current) * 0.15;
        const amp = amplitudeRef.current;

        const t = timeRef.current;

        if (phase === "speaking") {
            // Orange/amber pulsing orb
            const rings = 5;
            for (let r = rings; r >= 0; r--) {
                const baseRadius = 30 + r * 16;
                const pulseScale = 1 + amp * 0.5 * (1 + r * 0.2);
                const radius = baseRadius * pulseScale;
                const alpha = 0.15 - r * 0.02;

                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(240, 168, 120, ${Math.max(0.03, alpha + amp * 0.1)})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(240, 168, 120, ${0.2 + amp * 0.3})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Core orb
            const coreRadius = 28 + amp * 10;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            grad.addColorStop(0, "#f0a878");
            grad.addColorStop(1, "#7c2d12");
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Sound bars icon
            const barW = 3;
            const gap = 5;
            const bars = [0.4 + amp * 0.6, 0.6 + amp * 0.4, 0.3 + amp * 0.7];
            bars.forEach((h, i) => {
                const barH = 8 + h * 14;
                const x = cx - (bars.length * (barW + gap)) / 2 + i * (barW + gap) + gap / 2;
                const y = cy - barH / 2;
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fillRect(x, y, barW, barH);
            });

        } else if (phase === "listening") {
            // Green breathing orb
            const breathe = Math.sin(t * 2) * 0.15 + 1;

            const rings = 4;
            for (let r = rings; r >= 0; r--) {
                const baseRadius = 35 + r * 14;
                const radius = baseRadius * breathe + Math.sin(t * 3 + r) * 3;
                const alpha = 0.12 - r * 0.02;

                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(110, 231, 183, ${Math.max(0.03, alpha)})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(110, 231, 183, 0.2)`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Core orb
            const coreRadius = 30 * breathe;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            grad.addColorStop(0, "#6ee7b7");
            grad.addColorStop(1, "#065f46");
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Mic icon (simple circle + line)
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath();
            ctx.arc(cx, cy - 4, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(cx - 2, cy + 2, 4, 6);
            ctx.beginPath();
            ctx.arc(cx, cy + 8, 8, 0, Math.PI);
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 2;
            ctx.stroke();

        } else if (phase === "processing") {
            // Gray spinner
            const coreRadius = 28;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            grad.addColorStop(0, "#a8a29e");
            grad.addColorStop(1, "#57534e");
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Spinning arc
            ctx.beginPath();
            ctx.arc(cx, cy, 38, t * 3, t * 3 + Math.PI * 1.5);
            ctx.strokeStyle = "rgba(168, 162, 158, 0.6)";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.stroke();

        } else if (phase === "done") {
            // Green static with checkmark
            const coreRadius = 30;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            grad.addColorStop(0, "#6ee7b7");
            grad.addColorStop(1, "#065f46");
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Checkmark
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy);
            ctx.lineTo(cx - 3, cy + 8);
            ctx.lineTo(cx + 12, cy - 8);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();

        } else {
            // Idle — subtle breathing
            const breathe = Math.sin(t * 1.5) * 0.05 + 1;
            const coreRadius = 25 * breathe;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            grad.addColorStop(0, "#a8a29e");
            grad.addColorStop(1, "#57534e");
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        animFrameRef.current = requestAnimationFrame(draw);
    }, [phase]);

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="mx-auto"
            style={{ width: 200, height: 200 }}
        />
    );
}
