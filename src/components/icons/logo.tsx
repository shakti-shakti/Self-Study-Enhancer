
import { Brain } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center space-x-2", className)} {...props}>
      <Brain className="h-8 w-8 text-primary" />
      <span className="font-bold text-xl text-primary whitespace-nowrap">NEET Prep Pro</span>
    </div>
  );
}
