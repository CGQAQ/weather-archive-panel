"use client";

import type { CityHourlyData, MapMode, HourlyPoint } from "@/lib/types";

interface Props {
  cityName: string;
  province: string;
  currentValue: number;
  currentWeather: string;
  wind: string;
  hourlyData: CityHourlyData | null;
  mode: MapMode;
}

function getPointValue(p: HourlyPoint, mode: MapMode): number {
  switch (mode) {
    case "temperature":
      return p.temp;
    case "rain":
      return p.rain;
    case "humidity":
      return p.humidity;
    case "aqi":
      return p.aqi;
  }
}

function getModeLabel(mode: MapMode): string {
  switch (mode) {
    case "temperature":
      return "温度";
    case "rain":
      return "降雨量";
    case "humidity":
      return "湿度";
    case "aqi":
      return "AQI";
  }
}

function getModeUnit(mode: MapMode): string {
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

function Sparkline({ data, mode }: { data: CityHourlyData; mode: MapMode }) {
  const points = data.points;
  if (points.length < 2) return null;

  const values = points.map((p) => getPointValue(p, mode));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const w = 260;
  const h = 50;
  const padding = 4;
  const xStep = (w - padding * 2) / (points.length - 1);

  const pathD = values
    .map((v, i) => {
      const x = padding + i * xStep;
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");

  const areaD =
    pathD +
    `L${(padding + (values.length - 1) * xStep).toFixed(1)},${h - padding}` +
    `L${padding},${h - padding}Z`;

  return (
    <svg width={w} height={h} className="mt-1">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={padding} y={h - 1} fontSize="8" fill="#9ca3af">
        {points[0].hour}
      </text>
      <text
        x={w - padding}
        y={h - 1}
        fontSize="8"
        fill="#9ca3af"
        textAnchor="end"
      >
        {points[points.length - 1].hour}
      </text>
    </svg>
  );
}

export default function CityTooltip({
  cityName,
  province,
  currentValue,
  currentWeather,
  wind,
  hourlyData,
  mode,
}: Props) {
  const unit = getModeUnit(mode);
  const label = getModeLabel(mode);

  let high: number | null = null;
  let low: number | null = null;
  if (hourlyData && hourlyData.points.length > 0) {
    const values = hourlyData.points.map((p) => getPointValue(p, mode));
    high = Math.max(...values);
    low = Math.min(...values);
  }

  return (
    <div className="min-w-[280px]">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-bold text-base text-gray-800 dark:text-white">
          {province} · {cityName}
        </span>
        <span className="text-xs text-gray-400">{currentWeather}</span>
      </div>

      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentValue}
          {unit}
        </span>
        {high !== null && low !== null && (
          <span className="text-xs">
            <span className="text-red-500">
              ↑{high}
              {unit}
            </span>
            {" / "}
            <span className="text-blue-500">
              ↓{low}
              {unit}
            </span>
          </span>
        )}
      </div>

      <div className="text-xs text-gray-400 mb-1">{wind}</div>

      {hourlyData && hourlyData.points.length >= 2 && (
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">
            全天{label}变化
          </div>
          <Sparkline data={hourlyData} mode={mode} />
        </div>
      )}

      {hourlyData && hourlyData.points.length > 0 && (
        <div className="mt-1.5 max-h-[120px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-x-2 gap-y-0.5 text-[10px]">
            {hourlyData.points.map((p, i) => (
              <div
                key={i}
                className="flex justify-between"
              >
                <span className="text-gray-400">{p.hour}</span>
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {getPointValue(p, mode)}
                  {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
