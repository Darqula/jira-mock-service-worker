import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  formatValue?: (value: number) => string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, formatValue, value, onChange, ...props }, ref) => {
    const displayValue = formatValue
      ? formatValue(Number(value || 0))
      : value;

    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          className={cn(
            'flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0',
            className
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          {...props}
        />
        <span className="min-w-[60px] text-sm font-medium text-right">
          {displayValue}
        </span>
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
