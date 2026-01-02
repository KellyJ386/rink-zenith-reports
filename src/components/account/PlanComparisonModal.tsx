import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  max_users: number;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  features: string[];
}

interface PlanComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  currentPlanKey: string;
  currentUserCount: number;
  onSelectPlan: (planKey: string, billingCycle: "monthly" | "annual") => void;
}

export const PlanComparisonModal = ({
  open,
  onOpenChange,
  plans,
  currentPlanKey,
  currentUserCount,
  onSelectPlan,
}: PlanComparisonModalProps) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (cents: number | null) => {
    if (!cents) return "Contact Us";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getAnnualSavings = (plan: Plan) => {
    if (!plan.monthly_price_cents || !plan.annual_price_cents) return 0;
    const monthlyTotal = plan.monthly_price_cents * 12;
    return Math.round(((monthlyTotal - plan.annual_price_cents) / monthlyTotal) * 100);
  };

  const isDowngrade = (planKey: string) => {
    const planOrder = ["starter", "standard", "professional", "enterprise"];
    return planOrder.indexOf(planKey) < planOrder.indexOf(currentPlanKey);
  };

  const wouldExceedLimit = (plan: Plan) => {
    return currentUserCount > plan.max_users;
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan, billingCycle);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your facility's needs
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-4">
          <Label htmlFor="billing-toggle" className={cn(billingCycle === "monthly" && "font-semibold")}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === "annual"}
            onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
          />
          <Label htmlFor="billing-toggle" className={cn(billingCycle === "annual" && "font-semibold")}>
            Annual
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Save up to 20%
            </Badge>
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.plan_key === currentPlanKey;
            const isSelected = selectedPlan === plan.plan_key;
            const cannotDowngrade = isDowngrade(plan.plan_key) && wouldExceedLimit(plan);
            const savings = getAnnualSavings(plan);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "p-4 cursor-pointer transition-all relative",
                  isSelected && "ring-2 ring-primary",
                  isCurrent && "bg-muted/50",
                  cannotDowngrade && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => {
                  if (!cannotDowngrade && !isCurrent) {
                    setSelectedPlan(plan.plan_key);
                  }
                }}
              >
                {plan.plan_key === "professional" && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {plan.description}
                    </p>
                  </div>

                  <div className="py-2">
                    <span className="text-3xl font-bold">
                      {formatPrice(
                        billingCycle === "annual"
                          ? plan.annual_price_cents
                            ? Math.round(plan.annual_price_cents / 12)
                            : null
                          : plan.monthly_price_cents
                      )}
                    </span>
                    {plan.monthly_price_cents && (
                      <span className="text-muted-foreground">/mo</span>
                    )}
                    {billingCycle === "annual" && savings > 0 && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                        Save {savings}%
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm font-medium">
                    Up to {plan.max_users} users
                  </div>

                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {cannotDowngrade && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Too many users ({currentUserCount}/{plan.max_users})
                    </div>
                  )}

                  {isCurrent ? (
                    <Badge variant="outline" className="w-full justify-center">
                      Current Plan
                    </Badge>
                  ) : (
                    <div className="h-6" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlan || selectedPlan === currentPlanKey}
          >
            {selectedPlan && isDowngrade(selectedPlan) ? "Downgrade Plan" : "Upgrade Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
