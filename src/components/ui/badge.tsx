import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-800 border-primary-200",
        compliant: "bg-green-100 text-green-800 border-green-200",
        "non-compliant": "bg-red-100 text-red-800 border-red-200",
        "partially-compliant": "bg-yellow-100 text-yellow-800 border-yellow-200",
        "not-assessed": "bg-gray-100 text-gray-800 border-gray-200",
        "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
        outline: "text-gray-700 border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
