import type { NumberFieldProps } from "react-aria-components";
import { forwardRef } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button, Input, NumberField } from "react-aria-components";

import { cn } from "~/utils";
import { Separator } from "./separator";

export type NumberInputProps = NumberFieldProps &
  React.RefAttributes<HTMLDivElement>;

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <NumberField
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-within:ring-ring flex h-10 w-full rounded-md border text-sm focus-within:ring-2 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      >
        <Input className="bg-background flex-1 px-3 py-2 focus-visible:outline-none" />
        <div className="flex flex-col border-l">
          <Button
            slot="increment"
            className="hover:bg-secondary flex flex-1 items-center justify-center px-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </Button>
          <Separator />
          <Button
            slot="decrement"
            className="hover:bg-secondary flex flex-1 items-center justify-center px-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </div>
      </NumberField>
    );
  },
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
