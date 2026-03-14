"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import type { CityWeather, MapMode, CityHourlyData } from "@/lib/types";
import { PROVINCE_TO_CITY } from "@/lib/constants";
import { getMetricValue, getMetricUnit } from "@/lib/data";
import CityTooltip from "./CityTooltip";

interface Props {
  data: CityWeather[];
  mode: MapMode;
  hourlyData: Record<string, CityHourlyData>;
}

interface ProvincePathData {
  name: string;
  labelPos: [number, number] | null;
  path: string;
}

function getColorScale(mode: MapMode) {
  switch (mode) {
    case "temperature":
      return d3
        .scaleLinear<string>()
        .domain([-20, -5, 0, 10, 20, 30, 40])
        .range(["#1e3a5f", "#4a90d9", "#87ceeb", "#90ee90", "#ffcc00", "#ff6600", "#cc0000"])
        .clamp(true);
    case "rain":
      return d3
        .scaleLinear<string>()
        .domain([0, 5, 15, 30, 70, 140])
        .range(["#f0f9e8", "#bae4bc", "#7bccc4", "#43a2ca", "#0868ac", "#084081"])
        .clamp(true);
    case "humidity":
      return d3
        .scaleLinear<string>()
        .domain([0, 20, 40, 60, 80, 100])
        .range(["#fff5eb", "#fee6ce", "#fdae6b", "#f16913", "#d94801", "#8c2d04"])
        .clamp(true);
    case "aqi":
      return d3
        .scaleLinear<string>()
        .domain([0, 50, 100, 150, 200, 300])
        .range(["#00e400", "#ffff00", "#ff7e00", "#ff0000", "#99004c", "#7e0023"])
        .clamp(true);
  }
}

export default function ChinaMap({ data, mode, hourlyData }: Props) {
  const [paths, setPaths] = useState<ProvincePathData[]>([]);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredCity, setHoveredCity] = useState<CityWeather | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/china-paths.json")
      .then((res) => res.json())
      .then((json) => setPaths(json))
      .catch((err) => console.error("Failed to load map paths:", err));
  }, []);

  const cityLookup = useMemo(() => {
    const map = new Map<string, CityWeather>();
    for (const c of data) {
      map.set(c.city, c);
      map.set(c.province, c);
    }
    return map;
  }, [data]);

  const colorScale = getColorScale(mode);
  const unit = getMetricUnit(mode);

  const legendSteps =
    mode === "temperature"
      ? [-20, -5, 0, 10, 20, 30, 40]
      : mode === "rain"
        ? [0, 5, 15, 30, 70, 140]
        : mode === "humidity"
          ? [0, 20, 40, 60, 80, 100]
          : [0, 50, 100, 150, 200, 300];

  const updateTooltipPos = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const tooltipW = tooltip?.offsetWidth || 300;
    const tooltipH = tooltip?.offsetHeight || 200;
    const pad = 15;

    // Default: show to the right and above cursor
    let x = mouseX + pad;
    let y = mouseY - pad - tooltipH;

    // Clamp right edge
    if (x + tooltipW > containerRect.width) {
      x = mouseX - pad - tooltipW;
    }
    // Clamp left edge
    if (x < 0) {
      x = pad;
    }
    // Clamp top edge — flip below cursor if no room above
    if (y < 0) {
      y = mouseY + pad;
    }
    // Clamp bottom edge
    if (y + tooltipH > containerRect.height) {
      y = containerRect.height - tooltipH - pad;
    }

    setTooltipPos({ x, y });
  }, []);

  const handleMouseEnter = useCallback(
    (provinceName: string, e: React.MouseEvent) => {
      setHoveredProvince(provinceName);
      const cityName = PROVINCE_TO_CITY[provinceName];
      const city = cityName ? cityLookup.get(cityName) : null;
      setHoveredCity(city || null);
      updateTooltipPos(e);
    },
    [cityLookup, updateTooltipPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updateTooltipPos(e);
    },
    [updateTooltipPos]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredProvince(null);
    setHoveredCity(null);
  }, []);

  return (
    <div className="relative map-container" ref={containerRef}>
      <svg viewBox="0 0 900 700" className="w-full h-auto">
        {/* Non-hovered provinces */}
        {paths
          .filter((p) => p.name !== hoveredProvince)
          .map((province) => {
            const cityName = PROVINCE_TO_CITY[province.name];
            const city = cityName ? cityLookup.get(cityName) : null;
            const val = city ? getMetricValue(city.realtime, mode) : null;
            const fillColor =
              val !== null ? (colorScale(val) as string) : "#e0e0e0";

            return (
              <path
                key={province.name}
                d={province.path}
                fill={fillColor}
                stroke="#fff"
                strokeWidth={0.8}
                cursor="pointer"
                onMouseEnter={(e) => handleMouseEnter(province.name, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        {/* Hovered province on top */}
        {hoveredProvince &&
          paths
            .filter((p) => p.name === hoveredProvince)
            .map((province) => {
              const cityName = PROVINCE_TO_CITY[province.name];
              const city = cityName ? cityLookup.get(cityName) : null;
              const val = city ? getMetricValue(city.realtime, mode) : null;
              const fillColor =
                val !== null ? (colorScale(val) as string) : "#e0e0e0";

              return (
                <path
                  key={province.name}
                  d={province.path}
                  fill={fillColor}
                  stroke="#333"
                  strokeWidth={2}
                  cursor="pointer"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}

        {/* City labels with halo */}
        {paths.map((province) => {
          const cityName = PROVINCE_TO_CITY[province.name];
          const city = cityName ? cityLookup.get(cityName) : null;
          if (!city || !province.labelPos) return null;
          const val = getMetricValue(city.realtime, mode);
          const [x, y] = province.labelPos;

          return (
            <g key={`label-${province.name}`} pointerEvents="none">
              <text
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="9px"
                fontWeight="bold"
                fill="#1a1a1a"
                stroke="#fff"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {city.city}
              </text>
              <text
                x={x}
                y={y + 13}
                textAnchor="middle"
                fontSize="11px"
                fontWeight="bold"
                fill="#1a1a1a"
                stroke="#fff"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {val}
                {unit}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Rich tooltip */}
      {hoveredCity && (
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none z-10 bg-white text-gray-800 text-sm px-4 py-3 rounded-xl shadow-2xl border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
          }}
        >
          <CityTooltip
            cityName={hoveredCity.city}
            province={hoveredCity.province}
            currentValue={getMetricValue(hoveredCity.realtime, mode)}
            currentWeather={hoveredCity.realtime.weather}
            wind={`${hoveredCity.realtime.WD}${hoveredCity.realtime.WS}`}
            hourlyData={hourlyData[hoveredCity.city] || null}
            mode={mode}
          />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow dark:bg-gray-800/90 dark:text-gray-400">
        <div className="text-xs text-gray-500 mb-1 dark:text-gray-400">
          {mode === "temperature"
            ? "温度 (°C)"
            : mode === "rain"
              ? "24h降雨量 (mm)"
              : mode === "humidity"
                ? "湿度 (%)"
                : "AQI"}
        </div>
        <div className="flex items-center gap-0">
          {legendSteps.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className="w-8 h-3"
                style={{
                  backgroundColor: colorScale(step) as string,
                  borderRadius:
                    i === 0
                      ? "4px 0 0 4px"
                      : i === legendSteps.length - 1
                        ? "0 4px 4px 0"
                        : undefined,
                }}
              />
              <span className="text-[10px] text-gray-600 mt-0.5 dark:text-gray-400">
                {step}
                {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
