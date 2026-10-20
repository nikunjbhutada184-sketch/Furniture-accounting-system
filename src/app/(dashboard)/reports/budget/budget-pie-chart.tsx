"use client";

import { Pie, PieChart as RechartsPieChart, Cell, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

export function BudgetPieChart({
  achieved,
  balance,
  size = 40,
}: {
  achieved: number;
  balance: number;
  size?: number;
}) {
  const data = [
    { name: "Achieved", value: Math.max(0, achieved), fill: "hsl(var(--chart-1))" },
    { name: "Balance", value: Math.max(0, balance), fill: "hsl(var(--chart-2))" },
  ];

  const config = {
    achieved: { label: "Achieved", color: "hsl(var(--chart-1))" },
    balance: { label: "Balance", color: "hsl(var(--chart-2))" },
  };

  if (achieved === 0 && balance === 0) {
    return (
      <div
        className="rounded-full bg-muted flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] text-muted-foreground">N/A</span>
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="aspect-square" style={{ width: size, height: size, minHeight: size, minWidth: size }}>
      <RechartsPieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={size / 2}
          innerRadius={0}
          strokeWidth={1}
          stroke="hsl(var(--background))"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {payload[0]?.name}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {payload[0]?.value}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
      </RechartsPieChart>
    </ChartContainer>
  );
}
