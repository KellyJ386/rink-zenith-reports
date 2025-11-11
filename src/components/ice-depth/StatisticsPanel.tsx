import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";

interface StatisticsPanelProps {
  stats: {
    min: number;
    max: number;
    avg: number;
    stdDev: number;
  };
}

export const StatisticsPanel = ({ stats }: StatisticsPanelProps) => {
  const getStatusColor = (value: number, type: "min" | "max" | "stdDev") => {
    if (type === "min" && value < 0.75) return "text-destructive";
    if (type === "max" && value > 1.5) return "text-destructive";
    if (type === "stdDev" && value > 0.3) return "text-destructive";
    if (type === "stdDev" && value > 0.2) return "text-yellow-600";
    return "text-green-600";
  };

  const getQualityStatus = () => {
    if (stats.min < 0.75 || stats.max > 1.5 || stats.stdDev > 0.3) {
      return { label: "Critical", variant: "destructive" as const, icon: AlertCircle };
    }
    if (stats.stdDev > 0.2) {
      return { label: "Warning", variant: "secondary" as const, icon: AlertCircle };
    }
    return { label: "Good", variant: "default" as const, icon: CheckCircle };
  };

  const status = getQualityStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Automated Statistics</CardTitle>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Minimum Depth</p>
            </div>
            <p className={`text-2xl font-bold ${getStatusColor(stats.min, "min")}`}>
              {stats.min}" <span className="text-sm font-normal text-muted-foreground">(Target: ≥0.75")</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Maximum Depth</p>
            </div>
            <p className={`text-2xl font-bold ${getStatusColor(stats.max, "max")}`}>
              {stats.max}" <span className="text-sm font-normal text-muted-foreground">(Target: ≤1.5")</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Average Depth</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.avg}" <span className="text-sm font-normal text-muted-foreground">(Ideal: 1.0")</span>
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Std. Deviation</p>
            </div>
            <p className={`text-2xl font-bold ${getStatusColor(stats.stdDev, "stdDev")}`}>
              {stats.stdDev}" <span className="text-sm font-normal text-muted-foreground">(Target: ≤0.2")</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};