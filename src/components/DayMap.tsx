"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ── Types ──
interface Stop {
    index: number;
    name: string;
    time: string;
    description: string;
    lat: number;
    lng: number;
    mapQuery?: string;
    place?: string;
    category: string;
}

interface DayMapProps {
    stops: Stop[];
    highlightedIndex: number | null;
}

// ── Brutalist monochrome numbered markers ──
function createNumberedIcon(index: number) {
    return L.divIcon({
        className: "custom-numbered-marker",
        html: `<div style="
            background: black;
            color: white;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 13px;
            border: 3px solid black;
            font-family: system-ui, sans-serif;
            letter-spacing: 0;
        ">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
    });
}

// ── Sub-component that pans the map when highlightedIndex changes ──
function MapController({ stops, highlightedIndex, markerRefs }: {
    stops: Stop[];
    highlightedIndex: number | null;
    markerRefs: React.MutableRefObject<(L.Marker | null)[]>;
}) {
    const map = useMap();

    useEffect(() => {
        if (highlightedIndex != null && stops[highlightedIndex]) {
            const s = stops[highlightedIndex];
            map.panTo([s.lat, s.lng], { animate: true, duration: 0.4 });
            const marker = markerRefs.current[highlightedIndex];
            if (marker) {
                marker.openPopup();
            }
        }
    }, [highlightedIndex, stops, map, markerRefs]);

    return null;
}

// ── Layer toggle button (brutalist) ──
function LayerToggle({ isSatellite, onToggle }: { isSatellite: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 1000,
                background: isSatellite ? "black" : "white",
                color: isSatellite ? "white" : "black",
                border: "3px solid black",
                borderRadius: 0,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
            }}
        >
            {isSatellite ? "\u25a1 STREET" : "\u25a1 SATELLITE"}
        </button>
    );
}

// ── Main component ──
export default function DayMap({ stops, highlightedIndex }: DayMapProps) {
    const [isSatellite, setIsSatellite] = useState(true);
    const markerRefs = useRef<(L.Marker | null)[]>([]);

    const setMarkerRef = useCallback((index: number) => (ref: L.Marker | null) => {
        markerRefs.current[index] = ref;
    }, []);

    if (stops.length === 0) return null;

    // Build bounds
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]));

    // Route polyline points
    const routePoints: [number, number][] = stops.map((s) => [s.lat, s.lng]);

    return (
        <div className="relative overflow-hidden border-4 border-foreground" style={{ height: 400 }}>
            <LayerToggle isSatellite={isSatellite} onToggle={() => setIsSatellite((v) => !v)} />
            <MapContainer
                bounds={bounds}
                boundsOptions={{ padding: [50, 50] }}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
                scrollWheelZoom={true}
            >
                {/* Tile layers */}
                {isSatellite ? (
                    <>
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Tiles &copy; Esri"
                        />
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                            attribution=""
                        />
                    </>
                ) : (
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                        attribution="Tiles &copy; Esri"
                    />
                )}

                {/* Route polyline — single thick black line */}
                <Polyline
                    positions={routePoints}
                    pathOptions={{ color: "black", weight: 4, opacity: 1 }}
                />

                {/* Markers */}
                {stops.map((stop, i) => (
                    <Marker
                        key={i}
                        position={[stop.lat, stop.lng]}
                        icon={createNumberedIcon(i)}
                        ref={setMarkerRef(i)}
                    >
                        <Popup>
                            <div style={{ minWidth: 180, fontFamily: "system-ui, sans-serif" }}>
                                <strong style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stop.name}</strong>
                                <div style={{ fontSize: 11, color: "#555", marginTop: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{stop.time}</div>
                                <p style={{ fontSize: 11, marginTop: 4, color: "#333", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{stop.description}</p>
                                {stop.mapQuery && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${stop.mapQuery}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "inline-block",
                                            marginTop: 8,
                                            fontSize: 11,
                                            color: "black",
                                            fontWeight: 900,
                                            textDecoration: "none",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            border: "2px solid black",
                                            padding: "3px 8px",
                                        }}
                                    >
                                        ⌖ OPEN IN MAPS ↗
                                    </a>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <MapController
                    stops={stops}
                    highlightedIndex={highlightedIndex}
                    markerRefs={markerRefs}
                />
            </MapContainer>
        </div>
    );
}
