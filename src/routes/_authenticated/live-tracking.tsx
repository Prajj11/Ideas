import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Navigation, Loader2, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/live-tracking")({
  component: LiveTrackingPage,
});

interface TeamMember {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
}

const defaultCenter = [15.2993, 74.124]; // Goa

function LiveTrackingPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const leafletRef = useRef<typeof L | null>(null);
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    import("leaflet").then((module) => {
      const L = module.default;
      leafletRef.current = L;

      // Fix Leaflet's default icon path issues in Vite
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter as [number, number], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapInstanceRef.current);
      }
    });
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Get My Location
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
          if (!markersRef.current['me']) {
            // Create a custom icon for "Me"
            const myIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #f97316; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            markersRef.current['me'] = L.marker([latitude, longitude], { icon: myIcon }).addTo(mapInstanceRef.current);
            markersRef.current['me'].bindPopup("<b>You</b>");
            mapInstanceRef.current.setView([latitude, longitude], 14);
          } else {
            markersRef.current['me'].setLatLng([latitude, longitude]);
          }
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Simulate Member Movements
  useEffect(() => {
    if (members.length === 0 || !mapInstanceRef.current) return;

    const interval = setInterval(() => {
      setMembers(prev => prev.map(member => {
        // Random walk
        const newLat = member.lat + (Math.random() - 0.5) * 0.0005;
        const newLng = member.lng + (Math.random() - 0.5) * 0.0005;
        
        // Update marker
        const marker = markersRef.current[member.id];
        if (marker) {
          marker.setLatLng([newLat, newLng]);
        }
        
        return { ...member, lat: newLat, lng: newLng };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [members.length]);

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    // Start them near user or default center
    const [baseLat, baseLng] = myLocation || defaultCenter;
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;

    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      phone: newPhone,
      lat: (baseLat ?? 15.2993) + offsetLat,
      lng: (baseLng ?? 74.124) + offsetLng,
    };

    setMembers([...members, newMember]);
    setNewName("");
    setNewPhone("");

    // Add marker to map
    if (mapInstanceRef.current && leafletRef.current) {
       const L = leafletRef.current;
       const memberIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #0ea5e9; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${newName.charAt(0).toUpperCase()}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
      const marker = L.marker([newMember.lat, newMember.lng], { icon: memberIcon }).addTo(mapInstanceRef.current);
      marker.bindPopup(`<b>${newMember.name}</b><br>${newMember.phone}`);
      markersRef.current[newMember.id] = marker;
      
      // fit bounds if we have multiple
      const group = new L.FeatureGroup(Object.values(markersRef.current));
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    if (markersRef.current[id]) {
      markersRef.current[id].remove();
      delete markersRef.current[id];
    }
  };

  return (
    <AppShell title="Live tracking" subtitle="Locate your family members" back>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Map Area */}
        <div className="flex-1 rounded-3xl overflow-hidden border border-border/50 shadow-lg relative bg-card/50 backdrop-blur-sm z-10">
          <div ref={mapRef} className="absolute inset-0 z-0" />
          
          {/* Overlay Status */}
          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
            <div className="bg-background/90 backdrop-blur-md rounded-full px-4 py-2 text-sm font-semibold shadow-md flex items-center gap-2 border border-border/50">
              {myLocation ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  Your location active
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  {locationError ? locationError : "Locating you..."}
                </>
              )}
            </div>
            
            {members.length > 0 && (
              <div className="bg-background/90 backdrop-blur-md rounded-full px-4 py-2 text-sm font-semibold shadow-md flex items-center gap-2 border border-border/50 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                Tracking {members.length} member(s) live
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 z-10">
          <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Track someone
            </h2>
            <form onSubmit={addMember} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="E.g. Mom"
                  required
                  className="bg-background/50 border-border/50 shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={newPhone} 
                  onChange={e => setNewPhone(e.target.value)} 
                  placeholder="+91 98765 43210"
                  required
                  className="bg-background/50 border-border/50 shadow-inner"
                />
              </div>
              <Button type="submit" className="w-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all border-0 font-semibold">
                Send Invite
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 opacity-80">
                (Simulated for prototype: They will appear instantly on the map)
              </p>
            </form>
          </div>

          {members.length > 0 && (
            <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-sm flex-1 overflow-y-auto">
              <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-500" />
                Active Members
              </h2>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-border/30 hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-inner">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{member.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {member.phone}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeMember(member.id)}
                      className="text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-full"
                      title="Stop tracking"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
