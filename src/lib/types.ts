export interface RealtimeData {
  nameen: string;
  cityname: string;
  city: string;
  temp: string;
  tempf: string;
  WD: string;
  wde: string;
  WS: string;
  wse: string;
  SD: string;
  sd: string;
  qy: string;
  njd: string;
  time: string;
  rain: string;
  rain24h: string;
  aqi: string;
  aqi_pm25: string;
  weather: string;
  weathere: string;
  weathercode: string;
  limitnumber: string;
  date: string;
}

export interface WindInfo {
  direction: string;
  directionCode: string;
  level: string;
}

export interface DayNightWeather {
  date: string;
  weather: string;
  temp: string;
  tempUnit: string;
  wind: WindInfo;
  sunrise?: string;
  sunset?: string;
}

export interface CityWeather {
  id: string;
  province: string;
  city: string;
  realtime: RealtimeData;
  weather: {
    day: DayNightWeather;
    night: DayNightWeather;
  };
}

export interface WeatherSnapshot {
  timestamp: number;
  lastUpdate: string;
  data: CityWeather[];
}

export type MapMode = "temperature" | "rain" | "humidity" | "aqi";

export interface CityStats {
  city: string;
  province: string;
  current: number;
  historyMax: number;
  historyMin: number;
  historyAvg: number;
}

export interface HourlyPoint {
  hour: string; // "HH:MM"
  temp: number;
  rain: number;
  humidity: number;
  aqi: number;
  weather: string;
}

export interface CityHourlyData {
  city: string;
  points: HourlyPoint[];
  highTemp: number;
  lowTemp: number;
}
