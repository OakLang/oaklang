import type { ColorPickerProps as RACColorPickerProps } from "react-aria-components";
import { forwardRef } from "react";
import { XIcon } from "lucide-react";
import {
  ColorArea,
  ColorField,
  ColorSlider,
  ColorSwatch,
  ColorThumb,
  Input,
  ColorPicker as RACColorPicker,
  SliderOutput,
  SliderTrack,
} from "react-aria-components";

import type { InputProps } from "./input";
import { cn } from "~/utils";
import { Button } from "./button";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type ColorPickerProps = Omit<
  InputProps,
  "value" | "defaultValue" | "onChange"
> &
  RACColorPickerProps & {
    onRemoveColor?: () => void;
  };

const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    { value, defaultValue, onChange, className, onRemoveColor, ...props },
    ref,
  ) => {
    return (
      <RACColorPicker
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
      >
        <div className="relative">
          <ColorField aria-label={props["aria-label"]}>
            <Input
              {...props}
              className={cn(
                "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pr-20 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className,
              )}
              ref={ref}
            />
          </ColorField>

          {onRemoveColor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground absolute right-10 top-1/2 h-6 w-6 -translate-y-1/2"
                  onClick={onRemoveColor}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove Color</TooltipContent>
            </Tooltip>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 overflow-hidden rounded-sm border p-0"
                size="icon"
                variant="ghost"
              >
                <ColorSwatch
                  style={({ color }) => ({
                    background: String(color),
                  })}
                  className="absolute inset-0 shadow-none"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="grid w-48 gap-4">
              <ColorArea
                className="aspect-square rounded-lg border"
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
              >
                <ColorThumb className="h-6 w-6 rounded-full border-2 border-white shadow-sm" />
              </ColorArea>

              <ColorSlider
                colorSpace="hsb"
                channel="hue"
                className="grid gap-1"
              >
                <div className="flex items-center justify-between">
                  <Label>Hue</Label>
                  <SliderOutput className="text-muted-foreground text-sm" />
                </div>
                <SliderTrack
                  style={({ defaultStyle }) => ({
                    background: `${defaultStyle.background},
            repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`,
                  })}
                  className="h-6 rounded-full"
                >
                  <ColorThumb className="top-1/2 h-6 w-6 rounded-full border-2 border-white shadow-sm" />
                </SliderTrack>
              </ColorSlider>
              <ColorField>
                <Input className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </ColorField>
            </PopoverContent>
          </Popover>
        </div>
      </RACColorPicker>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
