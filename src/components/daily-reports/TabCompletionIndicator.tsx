import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabCompletionStatus } from "@/hooks/useTabSubmissionTracking";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TabCompletionIndicatorProps {
  status: TabCompletionStatus;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function TabCompletionIndicator({ 
  status, 
  showLabel = false,
  size = "sm" 
}: TabCompletionIndicatorProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            {status.isComplete ? (
              <CheckCircle2 className={cn(iconSize, "text-green-500")} />
            ) : status.isRequired ? (
              <AlertCircle className={cn(iconSize, "text-amber-500")} />
            ) : (
              <Circle className={cn(iconSize, "text-muted-foreground")} />
            )}
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {status.completedItems}/{status.totalItems}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{status.tabName}</p>
          <p className="text-xs text-muted-foreground">
            {status.isComplete 
              ? `Complete (${status.percentComplete}%)` 
              : status.isRequired 
                ? `Required - ${status.percentComplete}% complete`
                : `${status.percentComplete}% complete`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface OverallProgressProps {
  completed: number;
  total: number;
  percent: number;
  requiredComplete: boolean;
}

export function OverallProgressIndicator({ 
  completed, 
  total, 
  percent,
  requiredComplete 
}: OverallProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Tab Progress</span>
        <span className="font-medium">{completed}/{total} tabs</span>
      </div>
      <Progress value={percent} className="h-2" />
      {!requiredComplete && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Required tabs incomplete
        </p>
      )}
    </div>
  );
}
