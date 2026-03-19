// ============================================================
// components/dashboard/stat-card.tsx
// Reusable metric/stat card — tweakcn-compatible
// ============================================================

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number; // percentage
    label?: string;
  };
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  className,
  loading = false,
}: StatCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;
  const TrendIcon = trendPositive
    ? TrendingUp
    : trendNegative
    ? TrendingDown
    : Minus;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant ?? "secondary"} className="text-[10px] h-5">
              {badge.label}
            </Badge>
          )}
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>

            <div className="mt-1 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    trendPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : trendNegative
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                  {trend.label && (
                    <span className="text-muted-foreground font-normal">
                      {trend.label}
                    </span>
                  )}
                </span>
              )}

              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
