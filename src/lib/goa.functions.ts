import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPlaceInsights = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        place: z.string().trim().min(2).max(80),
        localTime: z.string().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      // 1. Get Coordinates using Photon
      const geocodeRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(data.place + " Goa")}&limit=1`,
      );
      const geocodeData = await geocodeRes.json();
      if (!geocodeData.features || geocodeData.features.length === 0) {
        throw new Error("Could not locate this place in Goa.");
      }
      
      const feature = geocodeData.features[0];
      const [lon, lat] = feature.geometry.coordinates;

      // 2. Fetch Wikipedia Summary
      let summaryText = `Welcome to ${data.place}, a beautiful spot in Goa! It is known for its vibrant culture, stunning views, and relaxing atmosphere.`;
      try {
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(data.place)}`,
        );
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.extract) {
            summaryText = wikiData.extract;
          }
        }
      } catch (e) {
        // Fallback to default
      }

      // 3. Fetch POIs using Photon API
      const fetchPOIs = async (query: string, category: 'eat' | 'sight' | 'activity') => {
        try {
          const offset = 0.05;
          const bbox = `${lon - offset},${lat - offset},${lon + offset},${lat + offset}`;
          const res = await fetch(`https://photon.komoot.io/api/?q=${query}&bbox=${bbox}&lat=${lat}&lon=${lon}&limit=20`);
          const data = await res.json();
          
          const badNames = [query.toLowerCase(), "tourism", "leisure", "restaurant", "hotel", "beach", "shop", "bar", "cafe", "supermarket"];
          let places = (data.features || []).filter((f: any) => 
            f.properties && 
            f.properties.name && 
            f.properties.name.length > 2 &&
            !badNames.includes(f.properties.name.toLowerCase())
          );
          
          // Deduplicate by name
          const uniquePlaces = [];
          const seen = new Set();
          for (const p of places) {
            if (!seen.has(p.properties.name)) {
              seen.add(p.properties.name);
              uniquePlaces.push(p);
            }
          }
          
          const eatTips = ["Try their local Goan specialties.", "Great ambiance for an evening meal.", "Ask for the catch of the day.", "Perfect spot for a quick bite.", "Known for excellent service."];
          const sightTips = ["Best visited during early morning or sunset.", "Don't forget your camera!", "A great spot for history lovers.", "Offers stunning panoramic views.", "Usually less crowded on weekdays."];
          const activityTips = ["Wear comfortable shoes.", "Carry some water and sunscreen.", "Great for groups and families.", "Bargaining is expected here.", "A truly authentic local experience."];
          
          const tipsArray = category === 'eat' ? eatTips : category === 'sight' ? sightTips : activityTips;

          return uniquePlaces.slice(0, 5).map((f: any, idx: number) => {
             const typeStr = f.properties.osm_value ? f.properties.osm_value.replace('_', ' ') : 'local spot';
             return {
                name: f.properties.name,
                description: f.properties.street ? `A popular ${typeStr} located near ${f.properties.street}.` : `A well-known ${typeStr} in the area.`,
                tip: tipsArray[idx % tipsArray.length],
             };
          });
        } catch (e) {
          return [];
        }
      };

      const [eat, sights, activities] = await Promise.all([
        fetchPOIs("restaurant", "eat"),
        fetchPOIs("viewpoint", "sight"),
        fetchPOIs("market", "activity"),
      ]);

      // Fill with fallbacks if empty
      while (eat.length < 3) eat.push({ name: "Local Beach Shack", description: "Fresh Goan seafood by the shore.", tip: "Try the fish thali." });
      while (sights.length < 3) sights.push({ name: "Sunset Point", description: "Beautiful panoramic views of the Arabian Sea.", tip: "Arrive 30 mins before sunset." });
      while (activities.length < 3) activities.push({ name: "Local Market Walk", description: "Explore the vibrant streets and local vendors.", tip: "Bargaining is expected." });

      const isBeach = data.place.toLowerCase().includes("beach");

      return {
        place: data.place,
        summary: summaryText,
        eat: eat.slice(0, 5),
        activities: activities.slice(0, 5),
        sights: sights.slice(0, 5),
        crowd: {
          percent: 65,
          band: "moderate",
          reason: "Typical seasonal crowd based on historical averages.",
          best_time_today: "Early morning or late afternoon",
          alternatives: [
            { name: "South Goa Beaches", why: "Generally quieter", travel_time: "45 mins" },
            { name: "Inland Spice Plantations", why: "Away from the coast", travel_time: "30 mins" },
          ],
        },
        rules: {
          allowed: [
            "Photography in public spaces",
            "Walking along the shore",
            "Visiting local cafes",
          ],
          not_allowed: isBeach ? [
            "Drinking alcohol on the beach",
            "Littering (strict fines)",
            "Driving vehicles on the sand",
            "Swimming beyond red flags",
          ] : [
            "Littering on the streets",
            "Loud music after 10 PM",
            "Parking in restricted zones",
          ],
        },
        warnings: [
          {
            title: "Tourist Scams",
            detail: "Always negotiate taxi fares before getting in.",
            severity: "low",
          },
          ...(isBeach ? [{
            title: "Rip Currents",
            detail: "Swim only in designated areas supervised by lifeguards.",
            severity: "high",
          }] as any : []),
        ],
      };
    } catch (error) {
      console.error("place insights failed", error);
      throw new Error("Could not load recommendations for this place. Please try again.");
    }
  });

// Curated authentic Goan POI database mapped to GOA_PLACES
type CuratedPOI = {
  name: string;
  type: "food" | "sight" | "activity" | "beach" | "rest" | "travel";
  durationMins: number;
  interests: string[];
  description: string;
  travel_note: string;
  bestTime?: "morning" | "lunch" | "afternoon" | "sunset" | "evening";
};

const GOA_CURATED_PLACES: Record<string, CuratedPOI[]> = {
  Panjim: [
    {
      name: "Fontainhas Latin Quarter",
      type: "sight",
      durationMins: 90,
      interests: ["History & heritage", "Beaches", "Local food"],
      description: "Stroll through the narrow winding streets lined with colorful 18th-century Portuguese colonial villas, azulejo tiles, and quaint art galleries.",
      travel_note: "Start your heritage walk near 31st January Road in central Panjim.",
      bestTime: "morning",
    },
    {
      name: "Our Lady of the Immaculate Conception Church",
      type: "sight",
      durationMins: 60,
      interests: ["History & heritage", "Churches & temples"],
      description: "Iconic gleaming white baroque church atop a zigzagging staircase overlooking Church Square and Panjim town.",
      travel_note: "Short 5-minute walk from Fontainhas.",
      bestTime: "morning",
    },
    {
      name: "Ritz Classic / Viva Panjim",
      type: "food",
      durationMins: 60,
      interests: ["Local food"],
      description: "Savor an authentic Goan fish thali with kingfish fry, prawn curry rice, and sol kadi at a cherished local institution.",
      travel_note: "Located right in central Panjim.",
      bestTime: "lunch",
    },
    {
      name: "Panjim Municipal Market & 18th June Road",
      type: "activity",
      durationMins: 75,
      interests: ["Markets & shopping", "Local food"],
      description: "Explore vibrant market stalls packed with fresh Goan cashew nuts, authentic feni, spices, handicrafts, and local sweets.",
      travel_note: "5 mins by taxi or short stroll down 18th June Road.",
      bestTime: "afternoon",
    },
    {
      name: "Miramar Beach & Dona Paula Viewpoint",
      type: "beach",
      durationMins: 90,
      interests: ["Beaches", "Nature & wildlife"],
      description: "Walk along the palm-fringed Miramar promenade down to the historic Dona Paula jetty where the Mandovi and Zuari rivers meet the Arabian Sea.",
      travel_note: "10 mins drive west along the scenic coastal road.",
      bestTime: "sunset",
    },
    {
      name: "Mandovi River Sunset Cruise",
      type: "activity",
      durationMins: 90,
      interests: ["Beaches", "Nightlife", "History & heritage"],
      description: "Enjoy a scenic 1-hour evening boat cruise along the Mandovi river with traditional Goan folk dances, music, and sunset river views.",
      travel_note: "Departs from Santa Monica jetty under the Mandovi Bridge.",
      bestTime: "sunset",
    },
    {
      name: "Joseph Bar (Fontainhas)",
      type: "activity",
      durationMins: 60,
      interests: ["Nightlife", "Local food"],
      description: "Charming vintage neighborhood pub famous for artisanal craft beers, feni cocktails, and a lively retro vibe.",
      travel_note: "Nestled in the heart of Fontainhas.",
      bestTime: "evening",
    },
  ],
  "Old Goa": [
    {
      name: "Basilica of Bom Jesus",
      type: "sight",
      durationMins: 90,
      interests: ["History & heritage", "Churches & temples"],
      description: "UNESCO World Heritage site containing the silver casket and mortal remains of St. Francis Xavier inside magnificent Jesuit architecture.",
      travel_note: "Main landmark of Old Goa heritage complex.",
      bestTime: "morning",
    },
    {
      name: "Se Cathedral",
      type: "sight",
      durationMins: 60,
      interests: ["History & heritage", "Churches & temples"],
      description: "One of the largest churches in Asia, built in Tuscan style, housing the legendary Golden Bell.",
      travel_note: "Located directly opposite the Basilica of Bom Jesus.",
      bestTime: "morning",
    },
    {
      name: "Church & Monastery of St. Francis of Assisi",
      type: "sight",
      durationMins: 60,
      interests: ["History & heritage"],
      description: "Historic 1661 church with Manueline entrance portal housing the Archaeological Museum of Old Goa.",
      travel_note: "Adjacent to Se Cathedral.",
      bestTime: "afternoon",
    },
    {
      name: "Ruins of St. Augustine Tower",
      type: "sight",
      durationMins: 45,
      interests: ["History & heritage"],
      description: "Dramatic 46-meter high belfry tower standing as a poignant remnant of a massive 17th-century Augustinian monastery.",
      travel_note: "5 mins walk up Holy Hill.",
      bestTime: "afternoon",
    },
    {
      name: "Heritage Cafe & Goan Thali Spot",
      type: "food",
      durationMins: 60,
      interests: ["Local food"],
      description: "Relaxed local lunch spot serving traditional Goan fish curry, cafreal, and bebinca dessert.",
      travel_note: "Located near the Old Goa bus stand.",
      bestTime: "lunch",
    },
  ],
  "Baga Beach": [
    {
      name: "Baga Beach Shoreline & Water Sports",
      type: "activity",
      durationMins: 90,
      interests: ["Water sports", "Beaches"],
      description: "Feel the rush of parasailing, banana boat rides, and jet skiing over the Arabian Sea waves.",
      travel_note: "Head straight to central Baga Beach point.",
      bestTime: "morning",
    },
    {
      name: "Brittos Beach Shack",
      type: "food",
      durationMins: 75,
      interests: ["Local food", "Beaches"],
      description: "Legendary oceanfront shack serving butter garlic prawns, Goan pork vindaloo, chilled drinks, and fresh baked desserts.",
      travel_note: "Located at the northern end of Baga Beach.",
      bestTime: "lunch",
    },
    {
      name: "Baga River & Flea Stalls",
      type: "activity",
      durationMins: 60,
      interests: ["Markets & shopping"],
      description: "Browse colorful beach stalls for wooden handicrafts, leather goods, souvenirs, and bohemian attire.",
      travel_note: "Short walk along Baga Creek road.",
      bestTime: "afternoon",
    },
    {
      name: "Tito's Lane Nightlife Strip",
      type: "activity",
      durationMins: 90,
      interests: ["Nightlife"],
      description: "Experience Goa's most famous nightlife lane featuring iconic clubs like Tito's, Cafe Mambo, and outdoor cocktail bars.",
      travel_note: "Tito's Lane connects Calangute-Baga road to the beach.",
      bestTime: "evening",
    },
  ],
  "Calangute Beach": [
    {
      name: "Calangute Beach Promenade",
      type: "beach",
      durationMins: 90,
      interests: ["Beaches", "Water sports"],
      description: "Walk along the 'Queen of Beaches', known for its expansive golden sands and lively beach atmosphere.",
      travel_note: "Access via Calangute main beach parking.",
      bestTime: "morning",
    },
    {
      name: "Souza Lobo Restaurant",
      type: "food",
      durationMins: 60,
      interests: ["Local food"],
      description: "Historic 1932 beachside restaurant famous for crab xacuti, fish caldin, and live acoustic music.",
      travel_note: "Right on Calangute beachfront.",
      bestTime: "lunch",
    },
    {
      name: "Calangute Market Square",
      type: "activity",
      durationMins: 60,
      interests: ["Markets & shopping"],
      description: "Shop for Goan cashews, spices, hand-woven carpets, beach accessories, and local trinkets.",
      travel_note: "Located around Calangute Circle.",
      bestTime: "afternoon",
    },
  ],
  "Vagator Beach": [
    {
      name: "Vagator Beach Cliffs & Ozran Cove",
      type: "beach",
      durationMins: 90,
      interests: ["Beaches", "Nature & wildlife"],
      description: "Explore the dramatic red cliffs, coconut groves, and the famous carved Lord Shiva face on Ozran Beach.",
      travel_note: "Descend the stone steps down from the main parking cliff.",
      bestTime: "morning",
    },
    {
      name: "Thalassa / Purple Martini Sunset Lounge",
      type: "food",
      durationMins: 90,
      interests: ["Local food", "Nightlife", "Beaches"],
      description: "Sip refreshing cocktails and dine on Mediterranean & Goan cuisine while taking in spectacular cliffside ocean sunset views.",
      travel_note: "Perched atop the Vagator cliffside.",
      bestTime: "sunset",
    },
  ],
  "Chapora Fort": [
    {
      name: "Chapora Fort Cliff Walk",
      type: "sight",
      durationMins: 90,
      interests: ["History & heritage", "Nature & wildlife", "Beaches"],
      description: "Hike up to the 1717 laterite fortress walls made world-famous by the film 'Dil Chahta Hai', offering 360-degree views of Chapora river and Vagator coast.",
      travel_note: "10 min uphill stone path from Chapora village parking.",
      bestTime: "sunset",
    },
    {
      name: "Chapora Fishing Jetty & Juice Center",
      type: "food",
      durationMins: 45,
      interests: ["Local food"],
      description: "Taste fresh tropical fruit juices, avocado shakes, and seafood snacks at local Chapora village cafes.",
      travel_note: "At the base of Chapora Fort hill.",
      bestTime: "afternoon",
    },
  ],
  "Fort Aguada": [
    {
      name: "Fort Aguada & 17th Century Lighthouse",
      type: "sight",
      durationMins: 90,
      interests: ["History & heritage", "Nature & wildlife"],
      description: "Explore the vast 1612 Portuguese fortress overlooking the Arabian Sea, housing a historic four-story lighthouse and freshwater cistern.",
      travel_note: "Situated on Sinquerim hilltop, Candolim.",
      bestTime: "morning",
    },
    {
      name: "Aguada Jail Museum",
      type: "sight",
      durationMins: 60,
      interests: ["History & heritage"],
      description: "Visit the meticulously restored former prison converted into a museum honoring Goa's freedom fighters.",
      travel_note: "Located at the lower fort complex near Sinquerim.",
      bestTime: "afternoon",
    },
    {
      name: "Sinquerim Beach & Fort Wall",
      type: "beach",
      durationMins: 75,
      interests: ["Beaches", "Water sports"],
      description: "Relax on pristine sands right beneath the dramatic lower bastion walls of Fort Aguada.",
      travel_note: "Just below the fort entry point.",
      bestTime: "sunset",
    },
  ],
  "Dudhsagar Falls": [
    {
      name: "Dudhsagar Waterfall Jungle Jeep Safari",
      type: "activity",
      durationMins: 120,
      interests: ["Nature & wildlife", "History & heritage"],
      description: "Ride an off-road 4x4 jeep through river crossings inside Bhagwan Mahavir Wildlife Sanctuary to witness the roaring 310m milk-white waterfall.",
      travel_note: "Jeeps depart from Kolem jeep counter.",
      bestTime: "morning",
    },
    {
      name: "Sahakari Spice Plantation Tour & Goan Lunch",
      type: "food",
      durationMins: 90,
      interests: ["Local food", "Nature & wildlife"],
      description: "Take a guided walking tour among vanilla, nutmeg, and cinnamon trees followed by an authentic Goan buffet served on banana leaves.",
      travel_note: "Located in Ponda, en route back from Dudhsagar.",
      bestTime: "lunch",
    },
  ],
  "Palolem Beach": [
    {
      name: "Palolem Crescent Bay & Kayaking",
      type: "beach",
      durationMins: 90,
      interests: ["Beaches", "Water sports", "Nature & wildlife"],
      description: "Paddle a kayak across the tranquil, horseshoe-shaped crescent bay surrounded by thick coconut palms.",
      travel_note: "Rent kayaks from beach shacks along central Palolem.",
      bestTime: "morning",
    },
    {
      name: "Butterfly Beach Boat Trip",
      type: "activity",
      durationMins: 90,
      interests: ["Nature & wildlife", "Water sports"],
      description: "Take a traditional wooden motorboat out to spot playful dolphins and land on secluded, pristine Butterfly Cove.",
      travel_note: "Boats leave directly from Palolem shore.",
      bestTime: "afternoon",
    },
    {
      name: "Dropadi Beachside Restaurant",
      type: "food",
      durationMins: 60,
      interests: ["Local food", "Beaches"],
      description: "Dine with your toes in the sand on grilled red snapper, tandoori seafood, and fresh tropical fruit bowls.",
      travel_note: "Located on Palolem main beach front.",
      bestTime: "sunset",
    },
  ],
};

function formatTime12h(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(m / 60);
  const mins = m % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
}

export const generateItinerary = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        place: z.string().trim().min(2).max(80),
        hours: z.number().int().min(1).max(24),
        interests: z.array(z.string().max(40)).min(1).max(8),
        pace: z.enum(["relaxed", "balanced", "packed"]),
        startTime: z.string().max(20).optional(),
        date: z.string().max(30).optional(),
        notes: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      // 1. Geocode location for coordinates & live fallback bbox
      let lat = 15.4989; // Panjim default
      let lon = 73.8278;

      try {
        const geocodeRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(data.place + " Goa")}&limit=1`,
        );
        if (geocodeRes.ok) {
          const geocodeData = await geocodeRes.json();
          if (geocodeData.features && geocodeData.features.length > 0) {
            lon = geocodeData.features[0].geometry.coordinates[0];
            lat = geocodeData.features[0].geometry.coordinates[1];
          }
        }
      } catch (e) {
        // Fallback coordinates
      }

      // 2. Fetch extra POIs dynamically via Photon API matching user interests
      const livePOIs: CuratedPOI[] = [];
      try {
        const offset = 0.04;
        const bbox = `${lon - offset},${lat - offset},${lon + offset},${lat + offset}`;
        const searchTerms = data.interests.includes("Local food")
          ? ["restaurant", "cafe"]
          : data.interests.includes("History & heritage")
            ? ["church", "viewpoint", "museum"]
            : ["attraction", "beach"];

        const liveFetches = searchTerms.slice(0, 2).map((term) =>
          fetch(`https://photon.komoot.io/api/?q=${term}&bbox=${bbox}&lat=${lat}&lon=${lon}&limit=10`)
            .then((res) => (res.ok ? res.json() : { features: [] }))
            .catch(() => ({ features: [] })),
        );

        const liveResults = await Promise.all(liveFetches);
        const badNames = ["tourism", "leisure", "restaurant", "hotel", "beach", "shop", "bar", "cafe", "supermarket"];

        for (const res of liveResults) {
          for (const f of res.features || []) {
            const name = f.properties?.name;
            if (
              name &&
              name.length > 3 &&
              !badNames.includes(name.toLowerCase())
            ) {
              const isFood = f.properties?.osm_value === "restaurant" || f.properties?.osm_value === "cafe";
              livePOIs.push({
                name,
                type: isFood ? "food" : "sight",
                durationMins: isFood ? 60 : 75,
                interests: isFood ? ["Local food"] : ["History & heritage", "Beaches"],
                description: isFood
                  ? `Enjoy authentic Goan food and refreshing drinks at ${name}.`
                  : `Explore ${name}, a popular spot near ${data.place}.`,
                travel_note: `Located near central ${data.place}.`,
              });
            }
          }
        }
      } catch (e) {
        // Live fetch fallback ignored if failed
      }

      // 3. Gather candidate POIs (Curated database + Live search results)
      const curatedList = GOA_CURATED_PLACES[data.place] ?? GOA_CURATED_PLACES["Panjim"];
      const allCandidates = [...curatedList, ...livePOIs];

      // Filter and rank candidate spots according to selected interests
      const matchedSpots = allCandidates.filter((poi) =>
        poi.interests.some((interest) => data.interests.includes(interest)),
      );
      const candidatesToUse = matchedSpots.length >= 3 ? matchedSpots : allCandidates;

      // 4. Time Math & Schedule Generation based on exact user hours free
      const [startH, startM] = (data.startTime || "09:00").split(":").map(Number);
      const initialMinutes = (isNaN(startH) ? 9 : startH) * 60 + (isNaN(startM) ? 0 : startM);
      let currentMinutes = initialMinutes;
      const targetEndMinutes = initialMinutes + data.hours * 60;

      const stops: Array<{
        time: string;
        title: string;
        type: "food" | "sight" | "activity" | "beach" | "rest" | "travel";
        duration: string;
        description: string;
        travel_note: string;
        lat: number;
        lng: number;
      }> = [];

      const seenNames = new Set<string>();
      const userNotes = data.notes?.toLowerCase() || "";

      // Fallback items to fill long itineraries if candidates run out
      const fallbackItems: CuratedPOI[] = [
        {
          name: `${data.place} Coastal & Sunset Promenade`,
          type: "beach",
          durationMins: 60,
          interests: ["Beaches"],
          description: `Relax and take a peaceful stroll along the scenic ${data.place} shoreline as the evening sets in.`,
          travel_note: "Located right by the main waterfront area.",
        },
        {
          name: `Evening Beach Shack & Goan Grill in ${data.place}`,
          type: "food",
          durationMins: 75,
          interests: ["Local food", "Nightlife"],
          description: "Unwind with grilled Goan seafood, refreshing beverages, and beachside music.",
          travel_note: "5 mins walk from the main beach access.",
        },
        {
          name: `Night Market & Handicrafts Stalls in ${data.place}`,
          type: "activity",
          durationMins: 60,
          interests: ["Markets & shopping", "Nightlife"],
          description: "Browse evening stalls for local souvenirs, handmade jewelry, spices, and resort wear.",
          travel_note: "Located along the main market road.",
        },
        {
          name: `Late Evening Lounge & Music Spot in ${data.place}`,
          type: "activity",
          durationMins: 60,
          interests: ["Nightlife"],
          description: "Experience the warm Goan nightlife with acoustic tunes, cocktails, and great company.",
          travel_note: "Popular spot near central area.",
        },
      ];

      let candidateIndex = 0;
      let fallbackIndex = 0;

      while (currentMinutes < targetEndMinutes - 20 && stops.length < 12) {
        let poi: CuratedPOI | undefined;

        if (candidateIndex < candidatesToUse.length) {
          poi = candidatesToUse[candidateIndex++];
        } else if (fallbackIndex < fallbackItems.length) {
          poi = fallbackItems[fallbackIndex++];
        } else {
          const remainingMins = targetEndMinutes - currentMinutes;
          poi = {
            name: `Evening Chill & Local Vibe in ${data.place}`,
            type: "rest",
            durationMins: Math.min(60, Math.max(30, remainingMins)),
            interests: ["Beaches", "Local food"],
            description: `Soak in the relaxed coastal atmosphere of ${data.place}.`,
            travel_note: "Enjoy at your own comfortable pace.",
          };
        }

        if (!poi) break;
        const normalized = poi.name.toLowerCase().trim();
        if (seenNames.has(normalized)) continue;
        seenNames.add(normalized);

        const remainingMinutes = targetEndMinutes - currentMinutes;
        const durationMins = Math.min(poi.durationMins, Math.max(30, remainingMinutes));

        const endMinutes = currentMinutes + durationMins;
        const timeSlot = `${formatTime12h(currentMinutes)} - ${formatTime12h(endMinutes)}`;

        let customDescription = poi.description;
        if (userNotes.includes("friend")) {
          customDescription += " Perfect vibe for hanging out and making memories with friends!";
        } else if (userNotes.includes("family") || userNotes.includes("toddler") || userNotes.includes("kid")) {
          customDescription += " Family-friendly environment with easy walking access.";
        } else if (userNotes.includes("scooter") || userNotes.includes("bike")) {
          customDescription += " Easy to reach by rental scooter with available parking nearby.";
        }

        const durationStr = durationMins >= 60
          ? `${(durationMins / 60).toFixed(1).replace(".0", "")} hour${durationMins > 60 ? "s" : ""}`
          : `${durationMins} mins`;

        stops.push({
          time: timeSlot,
          title: poi.name,
          type: poi.type,
          duration: durationStr,
          description: customDescription,
          travel_note: stops.length === 0 ? `Start your trip near ${data.place}` : poi.travel_note,
          lat,
          lng: lon,
        });

        // Add 15 min travel buffer if there's sufficient time remaining
        const hasTimeForBuffer = (endMinutes + 15) <= targetEndMinutes;
        currentMinutes = endMinutes + (hasTimeForBuffer ? 15 : 0);
      }

      const formattedDateStr = data.date
        ? new Date(data.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
        : undefined;

      return {
        title: `A ${data.pace} day in ${data.place}`,
        overview: formattedDateStr
          ? `Full ${data.hours}-hour itinerary for ${data.place} on ${formattedDateStr}${data.notes ? ` (${data.notes})` : ""}, spanning ${formatTime12h(initialMinutes)} to ${formatTime12h(currentMinutes)}.`
          : `Full ${data.hours}-hour itinerary for ${data.place}${data.notes ? ` (${data.notes})` : ""}, spanning ${formatTime12h(initialMinutes)} to ${formatTime12h(currentMinutes)}.`,
        date: data.date,
        stops: stops,
        tips: [
          "Always carry bottled water as Goa weather can be warm and humid.",
          "Rent a scooter or negotiate taxi fares in advance for easy commute.",
          "Check local church decorum (wear clothing covering shoulders & knees).",
        ],
      };
    } catch (error) {
      console.error("itinerary failed", error);
      throw new Error("Could not generate an itinerary. Please try again.");
    }
  });

