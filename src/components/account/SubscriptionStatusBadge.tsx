import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

interface SubscriptionStatusBadgeProps {
  status: string;
  periodEnd?: string | null;
  trialEndsAt?: string | null;
  className?: string;
}

export const SubscriptionStatusBadge = ({
  status,
  periodEnd,
  trialEndsAt,
  className,
}: SubscriptionStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return { label: "Active", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" };
      case "trialing":
        if (trialEndsAt) {
          const daysLeft = differenceInDays(parseISO(trialEndsAt), new Date());
          return {
            label: `Trial (${daysLeft} days left)`,
            variant: "secondary" as const,
            className: "bg-blue-500 hover:bg-blue-600 text-white",
          };
        }
        return { label: "Trial", variant: "secondary" as const, className: "bg-blue-500 hover:bg-blue-600 text-white" };
      case "past_due":
        return { label: "Past Due", variant: "destructive" as const, className: "" };
      case "cancelled":
        if (periodEnd) {
          const daysLeft = differenceInDays(parseISO(periodEnd), new Date());
          if (daysLeft > 0) {
            return {
              label: `Cancels in ${daysLeft} days`,
              variant: "outline" as const,
              className: "border-amber-500 text-amber-600",
            };
          }
        }
        return { label: "Cancelled", variant: "outline" as const, className: "border-destructive text-destructive" };
      case "paused":
        return { label: "Paused", variant: "outline" as const, className: "border-muted-foreground" };
      default:
        return { label: status, variant: "outline" as const, className: "" };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
