import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-glow-primary",
        secondary: "border-transparent bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border/60 bg-background/50 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
