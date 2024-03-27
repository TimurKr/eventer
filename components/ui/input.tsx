import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icons?: Partial<Record<"start" | "end", React.ReactNode>>;
  baseClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, icons, baseClassName, ...props }, ref) => {
    return (
      <div className={cn(baseClassName, "relative")}>
        {icons?.start && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            {icons.start}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
            icons?.start && "pl-10",
            icons?.end && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {icons?.end && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {icons.end}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
