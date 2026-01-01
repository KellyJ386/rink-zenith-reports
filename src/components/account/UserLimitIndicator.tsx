import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface UserLimitIndicatorProps {
  currentUsers: number;
  maxUsers: number;
}

export const UserLimitIndicator = ({ currentUsers, maxUsers }: UserLimitIndicatorProps) => {
  const percentage = Math.min((currentUsers / maxUsers) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <div className="p-3 rounded-full bg-primary/10">
        <Users className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">User Capacity</span>
          <span className={`text-sm font-semibold ${isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-500" : "text-muted-foreground"}`}>
            {currentUsers} / {maxUsers}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={`h-2 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-amber-500" : ""}`}
        />
        {isAtLimit && (
          <p className="text-xs text-destructive">User limit reached. Contact support to upgrade.</p>
        )}
        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-amber-500">Approaching user limit.</p>
        )}
      </div>
    </div>
  );
};
