"use client";

import { useState } from "react";
import type { CityWeather, MapMode, CityStats } from "@/lib/types";
import { getMetricValue, getMetricUnit } from "@/lib/data";

interface Props {
  data: CityWeather[];
  mode: MapMode;
  historyStats: Map<string, CityStats>;
}

type SortKey = "current" | "historyMax" | "historyAvg";
type SortDir = "asc" | "desc";

export default function RankList({ data, mode, historyStats }: Props) {
  const unit = getMetricUnit(mode);
  const [sortKey, setSortKey] = useState<SortKey>("current");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const rows = [...data]
    .map((c) => ({
      city: c,
      current: getMetricValue(c.realtime, mode),
      stats: historyStats.get(c.city),
    }))
    .sort((a, b) => {
      let av: number, bv: number;
      switch (sortKey) {
        case "current":
          av = a.current;
          bv = b.current;
          break;
        case "historyMax":
          av = a.stats?.historyMax ?? -Infinity;
          bv = b.stats?.historyMax ?? -Infinity;
          break;
        case "historyAvg":
          av = a.stats?.historyAvg ?? -Infinity;
          bv = b.stats?.historyAvg ?? -Infinity;
          break;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) {
      return <span className="text-gray-300 ml-0.5">↕</span>;
    }
    return (
      <span className="text-blue-500 ml-0.5">
        {sortDir === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden dark:bg-gray-800">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
        <h3 className="text-white font-bold text-sm">
          {mode === "temperature"
            ? "🌡️ 温度排行"
            : mode === "rain"
              ? "🌧️ 降雨排行"
              : mode === "humidity"
                ? "💧 湿度排行"
                : "🌫️ 空气质量排行"}
        </h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 dark:bg-gray-700">
            <tr className="text-xs text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">城市</th>
              <th
                className="px-3 py-2 text-right cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none"
                onClick={() => handleSort("current")}
              >
                当前
                <SortIcon field="current" />
              </th>
              <th
                className="px-3 py-2 text-right cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none"
                onClick={() => handleSort("historyMax")}
              >
                历史最高
                <SortIcon field="historyMax" />
              </th>
              <th
                className="px-3 py-2 text-right cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none"
                onClick={() => handleSort("historyAvg")}
              >
                历史均值
                <SortIcon field="historyAvg" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ city, current, stats }, i) => (
              <tr
                key={city.id}
                className="border-t border-gray-100 hover:bg-blue-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <td className="px-3 py-2 text-gray-400 font-mono dark:text-gray-500">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800 dark:text-gray-100">
                    {city.city}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {city.realtime.weather}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-gray-100">
                  {current}
                  {unit}
                </td>
                <td className="px-3 py-2 text-right text-xs text-orange-500">
                  {stats ? `${stats.historyMax}${unit}` : "-"}
                </td>
                <td className="px-3 py-2 text-right text-xs text-blue-500">
                  {stats ? `${stats.historyAvg.toFixed(1)}${unit}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
