import { useState } from "react";
import { useAccountContext } from "@/hooks/useAccountContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscriptionStatusBadge } from "@/components/account/SubscriptionStatusBadge";
import { PlanComparisonModal } from "@/components/account/PlanComparisonModal";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Download,
  Calendar,
  Users,
  ArrowUpRight,
  Check,
  Receipt,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const AccountBilling = () => {
  const { toast } = useToast();
  const { facility, userCount } = useAccountContext();
  const { subscription, plans, invoices, currentPlan, loading } = useSubscription(
    facility?.id || null
  );
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleSelectPlan = async (planKey: string, billingCycle: "monthly" | "annual") => {
    toast({
      title: "Plan Change Requested",
      description: `Upgrading to ${planKey} (${billingCycle}). This feature will integrate with payment processing.`,
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Billing & Subscription</h2>
          <p className="text-muted-foreground">Manage your subscription and billing history</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-[300px]" />
          </div>
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Billing & Subscription</h2>
        <p className="text-muted-foreground">Manage your subscription and billing history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your current plan and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{currentPlan?.name || "Standard"}</h3>
                  <SubscriptionStatusBadge
                    status={subscription?.status || "active"}
                    periodEnd={subscription?.current_period_end}
                    trialEndsAt={subscription?.trial_ends_at}
                  />
                </div>
                <p className="text-muted-foreground">{currentPlan?.description}</p>
              </div>
              <Button onClick={() => setShowPlanModal(true)}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Change Plan
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Users
                </div>
                <p className="text-xl font-semibold">
                  {userCount} / {currentPlan?.max_users || facility?.max_users || "∞"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Billing Cycle
                </div>
                <p className="text-xl font-semibold capitalize">
                  {subscription?.billing_cycle || "Monthly"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Current Period
                </div>
                <p className="text-sm font-medium">
                  {subscription?.current_period_start
                    ? format(parseISO(subscription.current_period_start), "MMM d")
                    : "—"}{" "}
                  -{" "}
                  {subscription?.current_period_end
                    ? format(parseISO(subscription.current_period_end), "MMM d, yyyy")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  Monthly Rate
                </div>
                <p className="text-xl font-semibold">
                  {currentPlan?.monthly_price_cents
                    ? formatPrice(currentPlan.monthly_price_cents)
                    : "Custom"}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Plan Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentPlan?.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Download Invoices
            </Button>
            {subscription?.status === "active" && (
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No billing history yet</p>
              <p className="text-sm">Your invoices will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(parseISO(invoice.invoice_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{formatPrice(invoice.amount_cents)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={invoice.status === "paid" ? "default" : "secondary"}
                        className={invoice.status === "paid" ? "bg-green-500" : ""}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PlanComparisonModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
        plans={plans}
        currentPlanKey={subscription?.plan_type || "standard"}
        currentUserCount={userCount}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default AccountBilling;
