"use client";

interface Props {
  value: string;
  onChange: (date: string) => void;
  loading?: boolean;
}

export default function DateSelector({ value, onChange, loading }: Props) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600 font-medium dark:text-gray-400">日期:</label>
      <input
        type="date"
        value={value}
        max={today}
        min="2022-11-01"
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                   dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <button
        onClick={() => onChange(today)}
        className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
      >
        今天
      </button>
      {loading && (
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}
