"use client";

import type { MapMode } from "@/lib/types";
import { MAP_MODE_LABELS } from "@/lib/constants";

interface Props {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

const modes: MapMode[] = ["temperature", "rain", "humidity", "aqi"];

export default function MapControls({ mode, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-2 text-sm rounded-md transition-all ${
            mode === m
              ? "bg-white text-blue-600 font-bold shadow-sm dark:bg-gray-600 dark:text-blue-400"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          }`}
        >
          {MAP_MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
