// components/ui/badge.tsx
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30",
        success:
          "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30",
        warning:
          "bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border border-yellow-500/30",
        destructive:
          "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30",
        secondary: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
