import { useEffect, useState } from "react";
import { Cloud, Droplets, MapPin, Wind, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog } from "lucide-react";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=15.2993&longitude=74.1240&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&timezone=Asia%2FKolkata"
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
    if (code === 1 || code === 2 || code === 3) return { text: "Cloudy", icon: Cloud };
    if (code === 45 || code === 48) return { text: "Fog", icon: CloudFog };
    if (code >= 51 && code <= 67) return { text: "Rain", icon: CloudRain };
    if (code >= 71 && code <= 77) return { text: "Snow", icon: CloudSnow };
    if (code >= 80 && code <= 82) return { text: "Showers", icon: CloudRain };
    if (code >= 85 && code <= 86) return { text: "Snow Showers", icon: CloudSnow };
    if (code >= 95 && code <= 99) return { text: "Thunderstorm", icon: CloudLightning };
    return { text: "Unknown", icon: Cloud };
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

  const { text: weatherText, icon: WeatherIcon } = getWeatherDetails(weather.current.weather_code, weather.current.is_day);

  return (
    <div className="group relative flex items-center gap-4 rounded-3xl border border-border/50 bg-card/60 px-5 py-4 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-inner">
        <WeatherIcon className="h-7 w-7 text-primary opacity-90 transition-transform duration-300 group-hover:scale-110" />
      </div>
      
      <div className="relative z-10 flex flex-col">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          Goa
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {Math.round(weather.current.temperature_2m)}°C
          </span>
          <span className="text-sm font-medium text-muted-foreground/80 capitalize">
            {weatherText}
          </span>
        </div>
        
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground/80">
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-blue-500/70" />
            {weather.current.relative_humidity_2m}%
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3 text-teal-500/70" />
            {weather.current.wind_speed_10m} km/h
          </span>
        </div>
      </div>
    </div>
  );
}
