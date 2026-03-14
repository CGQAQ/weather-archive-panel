"use client";

import { useState, useEffect, useCallback } from "react";
import ChinaMap from "@/components/ChinaMap";
import RankList from "@/components/RankList";
import DateSelector from "@/components/DateSelector";
import MapControls from "@/components/MapControls";
import ThemeToggle from "@/components/ThemeToggle";
import type {
  CityWeather,
  MapMode,
  CityStats,
  CityHourlyData,
  WeatherSnapshot,
} from "@/lib/types";
import { getMetricValue } from "@/lib/data";

const BASE_URL =
  "https://raw.githubusercontent.com/CGQAQ/weather-archive/main/weathers";

export default function Home() {
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [mode, setMode] = useState<MapMode>("temperature");
  const [weatherData, setWeatherData] = useState<CityWeather[]>([]);
  const [lastUpdate, setLastUpdate] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyStats, setHistoryStats] = useState<Map<string, CityStats>>(
    new Map()
  );
  const [hourlyData, setHourlyData] = useState<
    Record<string, CityHourlyData>
  >({});

  const fetchData = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url =
        dateStr === today
          ? `${BASE_URL}/latest.json`
          : `${BASE_URL}/${dateStr}/latest.json`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const snapshot: WeatherSnapshot = await res.json();
      setWeatherData(snapshot.data);
      setLastUpdate(snapshot.lastUpdate);
    } catch {
      try {
        const res = await fetch(`${BASE_URL}/latest.json`);
        const snapshot: WeatherSnapshot = await res.json();
        setWeatherData(snapshot.data);
        setLastUpdate(snapshot.lastUpdate);
      } catch {
        console.error("Failed to fetch weather data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch hourly data for the selected date
  const fetchHourly = useCallback(async (dateStr: string) => {
    try {
      const res = await fetch(`/api/hourly?date=${dateStr}`);
      if (!res.ok) return;
      const data = await res.json();
      setHourlyData(data);
    } catch {
      console.error("Failed to fetch hourly data");
    }
  }, []);

  // Fetch history data for stats
  const fetchHistory = useCallback(
    async (currentMode: MapMode, currentData: CityWeather[]) => {
      const stats = new Map<string, CityStats>();
      const snapshots: WeatherSnapshot[] = [];

      const promises = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i - 1);
        const dateStr = d.toISOString().split("T")[0];
        return fetch(`${BASE_URL}/${dateStr}/latest.json`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
      });

      const results = await Promise.all(promises);
      for (const r of results) {
        if (r) snapshots.push(r);
      }

      const cityValues = new Map<string, number[]>();
      for (const snap of snapshots) {
        for (const city of snap.data) {
          const val = getMetricValue(city.realtime, currentMode);
          if (!cityValues.has(city.city)) {
            cityValues.set(city.city, []);
          }
          cityValues.get(city.city)!.push(val);
        }
      }

      for (const city of currentData) {
        const val = getMetricValue(city.realtime, currentMode);
        const existing = cityValues.get(city.city) || [];
        const allVals = [...existing, val];
        stats.set(city.city, {
          city: city.city,
          province: city.province,
          current: val,
          historyMax: Math.max(...allVals),
          historyMin: Math.min(...allVals),
          historyAvg: allVals.reduce((a, b) => a + b, 0) / allVals.length,
        });
      }

      setHistoryStats(stats);
    },
    []
  );

  useEffect(() => {
    fetchData(date);
    fetchHourly(date);
  }, [date, fetchData, fetchHourly]);

  useEffect(() => {
    if (weatherData.length > 0) {
      fetchHistory(mode, weatherData);
    }
  }, [weatherData, mode, fetchHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gray-900 dark:from-gray-900 dark:to-gray-900">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 dark:bg-gray-800/80 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              中国天气数据面板
            </h1>
            {lastUpdate && (
              <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">
                数据更新: {lastUpdate}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <MapControls mode={mode} onChange={setMode} />
            <DateSelector value={date} onChange={setDate} loading={loading} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="bg-white rounded-xl shadow-lg p-4 overflow-hidden dark:bg-gray-800">
            {weatherData.length > 0 ? (
              <ChinaMap
                data={weatherData}
                mode={mode}
                hourlyData={hourlyData}
              />
            ) : loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-400 flex flex-col items-center gap-3 dark:text-gray-500">
                  <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>加载数据中...</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400 dark:text-gray-500">
                暂无数据
              </div>
            )}
          </div>

          <div>
            {weatherData.length > 0 && (
              <RankList
                data={weatherData}
                mode={mode}
                historyStats={historyStats}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
