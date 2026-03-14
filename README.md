# China Weather Archive Panel

An interactive weather data visualization dashboard for major Chinese cities, built with Next.js and deployed on Vercel.

**Live Demo:** [china-weather.vercel.app](https://china-weather.vercel.app)

## Features

- **Interactive China Heat Map** — Color-coded province map showing temperature, rainfall, humidity, or AQI. Hover any province to see detailed info.
- **Multiple Data Modes** — Switch between temperature, 24h rainfall, humidity, and air quality index views. The map, tooltip, and rank list all update accordingly.
- **Date Selector** — Browse historical weather data from November 2022 to today.
- **Rich Hover Tooltip** — Shows current value, daily high/low, a sparkline chart of the full day's hourly trend, and a complete hourly breakdown.
- **Sortable Rank List** — All 34 cities ranked by current value, 7-day historical max, or 7-day average. Click column headers to sort.
- **Dark Mode** — Toggle between light and dark themes. Persists to localStorage and defaults to system preference.
- **Responsive Layout** — Full viewport layout with no page scrolling. The rank list scrolls internally to match the map height.

## Data Source

Weather data is sourced from [CGQAQ/weather-archive](https://github.com/CGQAQ/weather-archive), which scrapes hourly snapshots from weather.com.cn via GitHub Actions. The archive covers 34 provincial capital cities across China.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Map:** Pre-generated SVG paths from GeoJSON, color scales via D3
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/hourly/route.ts   # API route for hourly weather data
│   ├── globals.css            # Tailwind v4 config + dark mode
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main dashboard page
├── components/
│   ├── ChinaMap.tsx           # SVG map with heat map coloring
│   ├── CityTooltip.tsx        # Rich tooltip with sparkline chart
│   ├── DateSelector.tsx       # Date picker
│   ├── MapControls.tsx        # Mode switcher (temp/rain/humidity/AQI)
│   ├── RankList.tsx           # Sortable city ranking table
│   └── ThemeToggle.tsx        # Light/dark mode toggle
├── lib/
│   ├── constants.ts           # Province-to-city mapping
│   ├── data.ts                # Data fetching utilities
│   └── types.ts               # TypeScript interfaces
public/
├── china.json                 # GeoJSON source data
└── china-paths.json           # Pre-generated SVG paths
```

## How the Map Works

The China map is rendered using pre-generated SVG path strings rather than client-side D3 geo processing. A build-time script projects GeoJSON coordinates through a Mercator projection and outputs the SVG `d` attributes directly. This avoids D3's anti-meridian clipping artifacts and ensures consistent rendering across browsers.

## Deployment

Push to `main` and Vercel deploys automatically, or deploy manually:

```bash
npx vercel --prod
```

## License

BSD-3-Clause
