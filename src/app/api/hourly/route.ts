import { NextRequest, NextResponse } from "next/server";
import type { WeatherSnapshot, HourlyPoint, CityHourlyData } from "@/lib/types";

const GITHUB_API =
  "https://api.github.com/repos/CGQAQ/weather-archive/contents/weathers";
const RAW_BASE =
  "https://raw.githubusercontent.com/CGQAQ/weather-archive/main/weathers";

interface GithubFileEntry {
  name: string;
  download_url: string;
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date parameter required" }, { status: 400 });
  }

  try {
    // List files in the date directory
    const listRes = await fetch(`${GITHUB_API}/${date}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 3600 },
    });

    if (!listRes.ok) {
      return NextResponse.json({ error: "Date not found" }, { status: 404 });
    }

    const files: GithubFileEntry[] = await listRes.json();
    const snapshotFiles = files
      .filter((f) => f.name !== "latest.json" && f.name.endsWith(".json"))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Fetch all snapshots in parallel (limit to avoid rate limits)
    const toFetch = snapshotFiles.slice(0, 24);
    const snapshots: WeatherSnapshot[] = [];

    const results = await Promise.allSettled(
      toFetch.map((f) =>
        fetch(`${RAW_BASE}/${date}/${f.name}`).then((r) =>
          r.ok ? r.json() : null
        )
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        snapshots.push(r.value);
      }
    }

    // Sort by timestamp
    snapshots.sort((a, b) => a.timestamp - b.timestamp);

    // Build hourly data per city
    const cityHourly = new Map<string, CityHourlyData>();

    for (const snap of snapshots) {
      const timeStr = snap.lastUpdate.split(" ")[1]?.substring(0, 5) || "";

      for (const city of snap.data) {
        if (!cityHourly.has(city.city)) {
          cityHourly.set(city.city, {
            city: city.city,
            points: [],
            highTemp: -Infinity,
            lowTemp: Infinity,
          });
        }

        const entry = cityHourly.get(city.city)!;
        const temp = parseFloat(city.realtime.temp) || 0;
        const point: HourlyPoint = {
          hour: timeStr,
          temp,
          rain: parseFloat(city.realtime.rain24h) || 0,
          humidity: parseFloat(city.realtime.SD) || 0,
          aqi: parseFloat(city.realtime.aqi) || 0,
          weather: city.realtime.weather,
        };

        entry.points.push(point);
        if (temp > entry.highTemp) entry.highTemp = temp;
        if (temp < entry.lowTemp) entry.lowTemp = temp;
      }
    }

    const result = Object.fromEntries(cityHourly);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch hourly data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
