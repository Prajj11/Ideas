import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Navigation, Loader2, Phone, LocateFixed, ShieldCheck, Battery, Signal, Radio } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/live-tracking")({
  component: LiveTrackingPage,
});

interface TeamMember {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  battery: number;
  lastPing: string;
}

const defaultCenter: [number, number] = [15.4989, 73.8278]; // Panaji, Goa

const INITIAL_MEMBERS: TeamMember[] = [
  { id: "m1", name: "Aarav (Child Tag)", phone: "+91 98231 44321", lat: 15.5553, lng: 73.7517, battery: 84, lastPing: "Just now" },
  { id: "m2", name: "Dad (Senior Tag)", phone: "+91 98221 55432", lat: 15.4925, lng: 73.7736, battery: 92, lastPing: "1m ago" },
];

function LiveTrackingPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const leafletRef = useRef<typeof L | null>(null);

  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((module) => {
      const L = module.default;
      leafletRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current).setView(defaultCenter, 11);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);
        mapInstanceRef.current = map;

        // Add Member markers
        INITIAL_MEMBERS.forEach((m) => {
          const memberIcon = L.divIcon({
            className: "custom-member-icon",
            html: `<div style="background-color: #06b6d4; color: white; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px;">${m.name.charAt(0)}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          const marker = L.marker([m.lat, m.lng], { icon: memberIcon }).addTo(map);
          marker.bindPopup(`<b>${m.name}</b><br>${m.phone}<br>Battery: ${m.battery}%`);
          markersRef.current[m.id] = marker;
        });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Track User Location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation([latitude, longitude]);

        if (mapInstanceRef.current && leafletRef.current) {
          const L = leafletRef.current;
          if (!markersRef.current["me"]) {
            const myIcon = L.divIcon({
              className: "custom-me-icon",
              html: `<div style="background-color: #f97316; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(249,115,22,0.6);"></div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            markersRef.current["me"] = L.marker([latitude, longitude], { icon: myIcon }).addTo(mapInstanceRef.current);
            markersRef.current["me"].bindPopup("<b>You (Guardian)</b>");
          } else {
            markersRef.current["me"].setLatLng([latitude, longitude]);
          }
        }
      },
      () => setLocationError("Unable to retrieve high-accuracy GPS coordinates"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    // Simulate location nearby
    const offsetLat = (Math.random() - 0.5) * 0.08;
    const offsetLng = (Math.random() - 0.5) * 0.08;
    const baseLat = myLocation ? myLocation[0] : defaultCenter[0];
    const baseLng = myLocation ? myLocation[1] : defaultCenter[1];

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim(),
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng,
      battery: Math.floor(Math.random() * 40) + 60,
      lastPing: "Just now",
    };

    setMembers([...members, newMember]);
    setNewName("");
    setNewPhone("");
    toast.success(`Connected ${newMember.name} to Live Radar`);

    if (mapInstanceRef.current && leafletRef.current) {
      const L = leafletRef.current;
      const memberIcon = L.divIcon({
        className: "custom-member-icon",
        html: `<div style="background-color: #06b6d4; color: white; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px;">${newMember.name.charAt(0)}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([newMember.lat, newMember.lng], { icon: memberIcon }).addTo(mapInstanceRef.current);
      marker.bindPopup(`<b>${newMember.name}</b><br>${newMember.phone}`);
      markersRef.current[newMember.id] = marker;
      mapInstanceRef.current.setView([newMember.lat, newMember.lng], 12);
    }
  };

  const focusMember = (m: TeamMember) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([m.lat, m.lng], 15, { animate: true });
      markersRef.current[m.id]?.openPopup();
    }
  };

  return (
    <AppShell title="Live Family GPS Radar" subtitle="Real-time location sharing & safety tracking across Goa" back>
      {/* Radar Header */}
      <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-2xl p-6 shadow-sm flex items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 px-3 py-0.5 text-xs font-bold text-cyan">
            <Radio className="size-3.5 animate-pulse" /> Active Satellite Radar
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground mt-1.5">
            Real-time Family Location Grid
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {myLocation ? "🟢 GPS Connected (High-Accuracy Mode)" : "🟡 Acquiring GPS Satellite Lock…"}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-bold font-mono">
            {members.length + 1} Active Signals
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="mt-6 h-80 sm:h-96 w-full overflow-hidden rounded-3xl border border-border/60 bg-secondary/40 shadow-inner z-0 relative"
      />

      {/* Connect Member Form */}
      <div className="mt-6 rounded-3xl border border-border/60 bg-card/75 backdrop-blur-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold font-display text-foreground mb-3 flex items-center gap-2">
          <Plus className="size-4 text-primary" /> Connect New Family Device
        </h3>
        <form onSubmit={handleAddMember} className="grid sm:grid-cols-3 gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Member Name (e.g. Maya)"
            required
            className="rounded-xl bg-secondary/40 border-border/60"
          />
          <Input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone Number (+91...)"
            required
            className="rounded-xl bg-secondary/40 border-border/60 font-mono"
          />
          <Button
            type="submit"
            className="rounded-xl font-bold bg-primary text-primary-foreground shadow-sm hover:scale-102 transition-all"
          >
            Add to Radar
          </Button>
        </form>
      </div>

      {/* Member Cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <div
            key={m.id}
            onClick={() => focusMember(m)}
            className="group rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-5 shadow-sm transition-all hover:shadow-lg hover:border-cyan/40 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan/10 text-cyan font-bold font-display text-base shrink-0 group-hover:scale-105 transition-transform">
                {m.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-foreground truncate">{m.name}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Battery className="size-3 text-emerald" /> {m.battery}%
                  </span>
                  <span>·</span>
                  <span>{m.lastPing}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${m.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex size-9 items-center justify-center rounded-full bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors shadow-xs"
                title={`Call ${m.name}`}
              >
                <Phone className="size-4" />
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-xs font-bold"
                onClick={() => focusMember(m)}
              >
                Focus
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
