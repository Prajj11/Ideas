import { useEffect, useState } from "react";
import {
  Cloud,
  Droplets,
  MapPin,
  Wind,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  ShieldCheck,
  AlertTriangle,
  Waves,
  X,
  Calendar,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=15.2993&longitude=74.1240&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=Asia%2FKolkata"
        );
        const data = await response.json();

        if (data.error) {
          setError(data.reason || "Failed to fetch weather data");
        } else {
          setWeather(data);
        }
      } catch (err) {
        setError("Failed to fetch weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherDetails = (code: number, isDay: number) => {
    if (code === 0) return { text: "Clear Sky", icon: isDay ? Sun : Sun };
    if (code === 1 || code === 2 || code === 3) return { text: "Partly Cloudy", icon: Cloud };
    if (code === 45 || code === 48) return { text: "Foggy", icon: CloudFog };
    if (code >= 51 && code <= 67) return { text: "Rain", icon: CloudRain };
    if (code >= 71 && code <= 77) return { text: "Snow", icon: CloudSnow };
    if (code >= 80 && code <= 82) return { text: "Passing Showers", icon: CloudRain };
    if (code >= 85 && code <= 86) return { text: "Snow Showers", icon: CloudSnow };
    if (code >= 95 && code <= 99) return { text: "Thunderstorm", icon: CloudLightning };
    return { text: "Pleasant", icon: Cloud };
  };

  const getBeachSafety = (windSpeed: number, weatherCode: number) => {
    if (weatherCode >= 95 || windSpeed >= 30) {
      return {
        flag: "red",
        label: "Red Flag — Dangerous Surf & High Tides",
        description: "Strictly no swimming or sea activities. Strong undertows and rip currents active.",
        color: "bg-red-500/10 text-red-600 border-red-500/30",
        badge: "🔴 Dangerous / No Swimming",
      };
    }
    if (windSpeed >= 18 || (weatherCode >= 51 && weatherCode <= 82)) {
      return {
        flag: "yellow",
        label: "Yellow Flag — Caution Advised",
        description: "Moderate sea chop. Swim only in designated zones between red-and-yellow flags patrolled by Drishti lifeguards.",
        color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        badge: "🟡 Moderate / Lifeguard Zone Only",
      };
    }
    return {
      flag: "green",
      label: "Green Flag — Safe Swimming & Water Sports",
      description: "Calm Arabian Sea waters with safe wave swell. Ideal for parasailing, kayaking, and beach walks.",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      badge: "🟢 Safe for Swimming",
    };
  };

  if (loading) {
    return (
      <div className="flex animate-pulse items-center gap-3 rounded-3xl border border-border/50 bg-card/60 px-5 py-4 backdrop-blur-xl">
        <div className="h-14 w-14 rounded-2xl bg-primary/10"></div>
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-20 rounded bg-primary/10"></div>
          <div className="h-6 w-24 rounded bg-primary/10"></div>
          <div className="h-3 w-32 rounded bg-primary/10"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return null;
  }

  const { text: weatherText, icon: WeatherIcon } = getWeatherDetails(
    weather.current.weather_code,
    weather.current.is_day
  );

  const beachSafety = getBeachSafety(
    weather.current.wind_speed_10m,
    weather.current.weather_code
  );

  // Next 12 hours from now
  const currentHour = new Date().getHours();
  const nextHourly = (weather.hourly?.time ?? [])
    .map((t, idx) => ({
      hour: new Date(t).getHours(),
      timeStr: new Date(t).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      temp: Math.round(weather.hourly?.temperature_2m[idx] ?? 0),
      rainProb: weather.hourly?.precipitation_probability[idx] ?? 0,
      code: weather.hourly?.weather_code[idx] ?? 0,
    }))
    .slice(currentHour, currentHour + 12);

  // 7-day forecast
  const dailyForecast = (weather.daily?.time ?? []).map((dayStr, idx) => {
    const d = new Date(dayStr);
    const dayName = idx === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    const maxT = Math.round(weather.daily?.temperature_2m_max[idx] ?? 0);
    const minT = Math.round(weather.daily?.temperature_2m_min[idx] ?? 0);
    const rainMax = weather.daily?.precipitation_probability_max[idx] ?? 0;
    const uvMax = weather.daily?.uv_index_max[idx] ?? 0;
    const code = weather.daily?.weather_code[idx] ?? 0;
    const details = getWeatherDetails(code, 1);
    return { dayName, maxT, minT, rainMax, uvMax, details };
  });

  return (
    <>
      {/* Clickable Standalone Quick Weather Bento Card */}
      <div
        onClick={() => setShowModal(true)}
        className="group relative h-full min-h-[160px] flex flex-col justify-between rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-2xl transition-all hover:shadow-lg hover:border-cyan/40 cursor-pointer"
        title="Click to view full 7-day Goa weather & beach swimming advisory"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <MapPin className="size-3.5 text-cyan" />
            <span>Goa Weather & Marine</span>
          </div>
          <span className="rounded-full bg-cyan/10 text-cyan px-2.5 py-0.5 text-[10px] font-bold">
            7-Day Station
          </span>
        </div>

        <div className="my-3 flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-cyan/10 text-cyan shadow-inner group-hover:scale-105 transition-transform">
            <WeatherIcon className="size-7" />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display tracking-tight text-foreground">
                {Math.round(weather.current.temperature_2m)}°C
              </span>
              <span className="text-xs font-semibold text-muted-foreground capitalize">
                {weatherText}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tap for 7-day swell forecast</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
            <Droplets className="size-3 text-cyan" />
            {weather.current.relative_humidity_2m}%
          </span>
          <span className="flex items-center gap-1 text-muted-foreground font-mono text-[11px]">
            <Wind className="size-3 text-cyan" />
            {weather.current.wind_speed_10m} km/h
          </span>
          <span className="rounded-full bg-emerald/10 text-emerald font-bold px-2 py-0.5 text-[10px] border border-emerald/20 ml-auto">
            {beachSafety.flag === "green" ? "🟢 Calm Sea" : beachSafety.flag === "yellow" ? "🟡 Caution" : "🔴 Rough Swell"}
          </span>
        </div>
      </div>

      {/* Comprehensive Weather & Marine Advisory Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border/60 bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <MapPin className="size-3.5" /> Goa, India · Live Marine & Weather Forecast
                </span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                  Overall Weather & Travel Advisory
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full bg-muted/60 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Current Conditions & Marine Swimming Flag */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/50 bg-primary/5 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Temperature</p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-4xl font-black text-foreground">
                      {Math.round(weather.current.temperature_2m)}°C
                    </span>
                    <p className="mt-1 text-sm font-semibold text-primary">{weatherText}</p>
                  </div>
                  <WeatherIcon className="size-12 text-primary/80" />
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Droplets className="size-3.5 text-blue-500" /> Humidity {weather.current.relative_humidity_2m}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="size-3.5 text-teal-500" /> Wind {weather.current.wind_speed_10m} km/h
                  </span>
                </div>
              </div>

              {/* Beach Swimming Safety Flag */}
              <div className={`rounded-2xl border p-5 ${beachSafety.color}`}>
                <div className="flex items-center gap-2">
                  <Waves className="size-5" />
                  <p className="text-xs font-bold uppercase tracking-wider">Beach & Marine Safety Flag</p>
                </div>
                <h4 className="mt-2 text-base font-bold">{beachSafety.label}</h4>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{beachSafety.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold">
                  <ShieldCheck className="size-4" /> Drishti Marine Lifeguards on duty: 7 AM - 6:30 PM
                </div>
              </div>
            </div>

            {/* Hourly Weather Radar */}
            {nextHourly.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" /> Next 12 Hours Forecast
                </h3>
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {nextHourly.map((h, idx) => {
                    const HourIcon = getWeatherDetails(h.code, h.hour >= 6 && h.hour <= 18 ? 1 : 0).icon;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-between rounded-xl border border-border/40 bg-secondary/30 p-3 min-w-[70px] text-center shrink-0"
                      >
                        <span className="text-xs font-medium text-muted-foreground">{h.timeStr}</span>
                        <HourIcon className="size-5 my-2 text-primary" />
                        <span className="text-sm font-bold text-foreground">{h.temp}°</span>
                        {h.rainProb > 0 ? (
                          <span className="text-[10px] font-semibold text-blue-500 flex items-center gap-0.5 mt-1">
                            <Droplets className="size-2.5" /> {h.rainProb}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 mt-1">0% rain</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7-Day Weather Forecast */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" /> 7-Day Goa Weather Outlook
              </h3>
              <div className="mt-3 space-y-2">
                {dailyForecast.map((d, idx) => {
                  const DayIcon = d.details.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/40 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
                    >
                      <span className="w-16 font-bold text-foreground">{d.dayName}</span>
                      <div className="flex items-center gap-2 flex-1 pl-2">
                        <DayIcon className="size-5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground capitalize hidden sm:inline">
                          {d.details.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        {d.rainMax > 20 && (
                          <span className="text-xs font-semibold text-blue-500 flex items-center gap-1">
                            <Droplets className="size-3" /> {d.rainMax}% rain
                          </span>
                        )}
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          UV {d.uvMax}
                        </span>
                        <span className="font-bold text-foreground min-w-[70px]">
                          {d.maxT}° <span className="text-muted-foreground font-normal">/ {d.minT}°</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sun & Outdoor Sightseeing Advice */}
            <div className="mt-6 rounded-2xl border border-border/50 bg-secondary/30 p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
              <Info className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Best Outdoor Exploration Hours</p>
                <p className="mt-0.5">
                  Early mornings (<strong>6:30 AM – 10:30 AM</strong>) and late afternoons (<strong>4:00 PM – 7:00 PM</strong>)
                  offer the best ocean breezes and comfortable temperatures for beach hopping, fort treks, and scooter rides.
                  Carry hydration and wear SPF 50+ sunscreen during peak midday heat.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowModal(false)}
                className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.01] active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

