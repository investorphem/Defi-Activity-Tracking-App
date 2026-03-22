"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
          {label}
        </p>
        <p className="text-xl font-mono font-bold text-orange-500">
          ${payload[0].value.toLocaleString()}
        </p>
        <p className="text-[10px] text-emerald-400 font-medium">Verified on Stacks</p>
      </div>
    );
  }
  return null;
};

export default function TvlChart({ data }) {
  return (
    <div className="w-full h-[350px] -ml-4"> {/* Pulling left slightly to align Y-axis */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {/* Gradient for the area fill */}
            <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Subtle Grid Lines */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.03)" 
          />

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
            dy={10}
            minTickGap={30}
          />

          <YAxis
            hide={true} // Cleaner modern look, or use width={0} if you want to keep ticks
            domain={["auto", "auto"]}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(249, 115, 22, 0.2)", strokeWidth: 2 }} />

          <Area
            type="monotone"
            dataKey="tvl"
            stroke="#f97316"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTvl)"
            animationDuration={2000}
            // Add a subtle glow filter effect
            filter="drop-shadow(0px 4px 8px rgba(249, 115, 22, 0.3))"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
