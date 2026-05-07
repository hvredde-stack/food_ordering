"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

interface Analytics {
  range: { days: number; since: string };
  kpis: {
    total_orders: number;
    total_revenue_cents: number;
    happy: number;
    sad: number;
    avg_rating: number | null;
  };
  peakByHour: { hour: number; orders: number; revenue_cents: number }[];
  volumeByDay: { day: string; orders: number; revenue_cents: number }[];
  topDishes: { dish_id: string; dish_name: string; units: number; revenue_cents: number }[];
  sentimentByDay: { day: string; happy: number; sad: number }[];
  recentFeedback: { rating: number; comment: string | null; created_at: string }[];
}

const RANGES = [
  { label: "7 days",  days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export function AnalyticsView({ currency }: { currency: string }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted">Trends across your restaurant.</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={r.days === days ? "primary" : "secondary"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="text-muted">Loading…</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Orders"    value={data.kpis.total_orders} />
            <Stat label="Revenue"   value={formatMoney(data.kpis.total_revenue_cents, currency)} />
            <Stat label="Happy"     value={data.kpis.happy} tone="text-green-600" />
            <Stat label="Sad"       value={data.kpis.sad}   tone="text-red-600" />
            <Stat
              label="Avg rating"
              value={data.kpis.avg_rating != null ? data.kpis.avg_rating.toFixed(2) : "—"}
            />
          </div>

          <Card>
            <CardHeader><div className="font-semibold">Order volume by day</div></CardHeader>
            <CardBody className="h-72">
              <ResponsiveContainer>
                <LineChart data={data.volumeByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><div className="font-semibold">Peak hours (orders by hour of day)</div></CardHeader>
              <CardBody className="h-72">
                <ResponsiveContainer>
                  <BarChart data={data.peakByHour}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><div className="font-semibold">Sentiment trend</div></CardHeader>
              <CardBody className="h-72">
                <ResponsiveContainer>
                  <LineChart data={data.sentimentByDay}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="happy" stroke="#16a34a" strokeWidth={2} />
                    <Line type="monotone" dataKey="sad"   stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader><div className="font-semibold">Top dishes</div></CardHeader>
            <div className="divide-y divide-border">
              {data.topDishes.length === 0 ? (
                <div className="p-6 text-center text-muted">No sales yet.</div>
              ) : (
                data.topDishes.map((d, i) => (
                  <div key={d.dish_id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted w-5 text-right">{i + 1}</div>
                      <div className="font-medium">{d.dish_name}</div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-muted">{d.units} sold</div>
                      <div className="font-semibold">{formatMoney(d.revenue_cents, currency)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader><div className="font-semibold">Recent feedback</div></CardHeader>
            <div className="divide-y divide-border">
              {data.recentFeedback.length === 0 ? (
                <div className="p-6 text-center text-muted">No feedback yet.</div>
              ) : (
                data.recentFeedback.map((f, i) => (
                  <div key={i} className="p-3">
                    <div className="flex justify-between text-xs text-muted">
                      <span>{new Date(f.created_at).toLocaleString()}</span>
                      <span>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                    </div>
                    {f.comment && <div className="text-sm mt-1">{f.comment}</div>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${tone ?? ""}`}>{value}</div>
      </CardBody>
    </Card>
  );
}
