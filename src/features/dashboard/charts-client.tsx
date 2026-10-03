"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { rupiah } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";
export function TrendChart({
  data,
}: {
  data: { name: string; expense: number; income: number }[];
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className="h-[230px] w-full min-w-0"
      role="img"
      aria-label="Grafik tren pemasukan dan pengeluaran"
    >
      <AreaChart
        responsive
        style={{ width: "100%", height: 230 }}
        data={data}
        margin={{ left: -22, right: 10, top: 15, bottom: 0 }}
      >
        <defs>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 5"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) =>
            v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}rb`
          }
        />
        <Tooltip
          formatter={(v) => rupiah(Number(v))}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
          }}
        />
        <Area
          isAnimationActive={!reduced}
          animationDuration={600}
          name="Pengeluaran"
          type="monotone"
          dataKey="expense"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill="url(#expenseGradient)"
        />
        <Area
          isAnimationActive={!reduced}
          animationDuration={600}
          name="Pemasukan"
          type="monotone"
          dataKey="income"
          stroke="#10b981"
          strokeWidth={2}
          fill="transparent"
        />
      </AreaChart>
    </div>
  );
}
export function CompositionChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const reduced = useReducedMotion();
  return (
    <div>
      <div
        className="relative mx-auto h-[190px] w-full max-w-[240px]"
        role="img"
        aria-label={`Komposisi pengeluaran: ${rupiah(total)}`}
      >
        <PieChart width={240} height={190}>
          <Pie
            isAnimationActive={!reduced}
            animationDuration={600}
            data={data}
            dataKey="value"
            innerRadius={61}
            outerRadius={83}
            paddingAngle={4}
            stroke="none"
            cornerRadius={4}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => rupiah(Number(v))}
            contentStyle={{
              borderRadius: 12,
              background: "var(--card)",
              border: "1px solid var(--border)",
              fontSize: 11,
            }}
          />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">
            Total pengeluaran
          </span>
          <span className="number mt-1 text-lg font-bold">
            {total >= 1000000
              ? `Rp${(total / 1000000).toFixed(2).replace(".", ",")} jt`
              : rupiah(total)}
          </span>
        </div>
      </div>
      <div className="mt-2 space-y-2.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]">
            <span
              className="size-2 rounded-full"
              style={{ background: d.color }}
            />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-medium">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
