import * as React from "react";

import { cn } from "@/lib/utils";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Button } from "./button";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icons?: Partial<Record<"start" | "end", React.ReactNode>>;
  baseClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, icons, baseClassName, ...props }, ref) => {
    const [visible, setVisible] = React.useState(type != "password");
    return (
      <div className={cn(baseClassName, "relative")}>
        {icons?.start && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            {icons.start}
          </div>
        )}
        <input
          type={type === "password" ? (visible ? "text" : "password") : type}
          ref={ref}
          {...props}
          className={cn(
            "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error && "!border-destructive focus-visible:ring-destructive",
            icons?.start && "pl-10",
            icons?.end && "pr-10",
            type === "password" && "pr-8",
            icons?.end && type === "password" && "pr-16",
            className,
          )}
        />
        {(icons?.end || type === "password") && (
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-1">
            {icons?.end}
            {type === "password" && (
              <Button
                variant={"ghost"}
                size={"xs"}
                className="px-1"
                type="button"
                tabIndex={-1}
              >
                {visible ? (
                  <EyeSlashIcon
                    className="h-4 w-4"
                    onClick={() => setVisible(false)}
                  />
                ) : (
                  <EyeIcon
                    className="h-4 w-4"
                    onClick={() => setVisible(true)}
                  />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
