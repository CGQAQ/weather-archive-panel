import type { WeatherSnapshot, MapMode } from "./types";

const BASE_URL =
  "https://raw.githubusercontent.com/CGQAQ/weather-archive/main/weathers";

export async function fetchWeatherByDate(
  dateStr: string
): Promise<WeatherSnapshot | null> {
  // Try fetching the latest snapshot for a given date directory
  const url = `${BASE_URL}/${dateStr}/latest.json`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchLatestWeather(): Promise<WeatherSnapshot | null> {
  const url = `${BASE_URL}/latest.json`;
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchHistoryData(
  days: number = 7
): Promise<WeatherSnapshot[]> {
  const results: WeatherSnapshot[] = [];
  const today = new Date();

  const promises = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i - 1);
    const dateStr = d.toISOString().split("T")[0];
    return fetchWeatherByDate(dateStr);
  });

  const snapshots = await Promise.all(promises);
  for (const s of snapshots) {
    if (s) results.push(s);
  }
  return results;
}

export function getMetricValue(
  realtime: { temp: string; rain24h: string; SD: string; aqi: string },
  mode: MapMode
): number {
  switch (mode) {
    case "temperature":
      return parseFloat(realtime.temp) || 0;
    case "rain":
      return parseFloat(realtime.rain24h) || 0;
    case "humidity":
      return parseFloat(realtime.SD) || 0;
    case "aqi":
      return parseFloat(realtime.aqi) || 0;
  }
}

export function getMetricUnit(mode: MapMode): string {
  switch (mode) {
    case "temperature":
      return "°C";
    case "rain":
      return "mm";
    case "humidity":
      return "%";
    case "aqi":
      return "";
  }
}
