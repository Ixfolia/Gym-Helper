import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import WeightBaselineAck from "@/components/WeightBaselineAck";
import { useWeightUnit } from "@/lib/weightUnitContext";

export default function WeightSparkline({ data }) {
  const { unit } = useWeightUnit();
  if (!data || data.length === 0) {
    return (
      <div className="flex h-12 items-center text-xs font-light text-foreground/30">
        Not enough weigh-ins yet.
      </div>
    );
  }
  if (data.length === 1) {
    return (
      <div className="flex items-center justify-center py-2">
        <WeightBaselineAck weightKg={data[0].weight} dateStr={data[0].date} unit={unit} />
      </div>
    );
  }
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} hide />
          <Line type="monotone" dataKey="weight" stroke="hsl(193 100% 50%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}