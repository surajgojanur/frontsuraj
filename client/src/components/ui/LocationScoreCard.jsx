import React from "react";

const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

const deltaBadgeClass = (delta) => {
  if (delta > 0) return "bg-emerald-100 text-emerald-700";
  if (delta < 0) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

export default function LocationScoreCard({ data, loading }) {
  if (loading) {
    return (
      <div className="w-80 bg-white/90 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-5 space-y-4">
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
        <div className="h-10 w-20 bg-muted animate-pulse rounded" />
        <div className="h-2 w-full bg-muted/70 animate-pulse rounded" />
        <div className="space-y-2">
          <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const progressPercent = Math.min(
    100,
    Math.max(0, (data.score / (data.scoreMax || 100)) * 100)
  );

  return (
    <div className="w-80 bg-white/95 backdrop-blur-sm border border-border rounded-2xl shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Location Score
          </p>
          <h3 className="text-lg font-semibold text-foreground mt-1">
            Out of {data.scoreMax ?? 100}
          </h3>
        </div>
        <div className="text-3xl font-bold text-primary">
          {data.score}
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
        <div className="space-y-1">
          <dt className="text-xs uppercase tracking-wide">Nearest Target</dt>
          <dd className="font-medium text-foreground">
            {formatDistance(data.targetNearest?.distance)}
          </dd>
          <dd className="truncate">
            {data.targetNearest?.place?.name || "—"}
          </dd>
        </div>
        <div className="space-y-1 text-right">
          <dt className="text-xs uppercase tracking-wide">Nearest Competitor</dt>
          <dd className="font-medium text-foreground">
            {formatDistance(data.competitorNearest?.distance)}
          </dd>
          <dd className="truncate">
            {data.competitorNearest?.place?.name || "—"}
          </dd>
        </div>
      </dl>

      {Array.isArray(data.adjustments) && data.adjustments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Score Factors
          </p>
          <ul className="space-y-1.5">
            {data.adjustments.map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-foreground/80">{item.label}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${deltaBadgeClass(
                    item.delta
                  )}`}
                >
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
