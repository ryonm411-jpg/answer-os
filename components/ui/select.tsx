"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedLabel?: React.ReactNode;
  setSelectedLabel: (label: React.ReactNode) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a <Select>");
  }
  return context;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  children,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        isOpen,
        setIsOpen,
        selectedLabel,
        setSelectedLabel,
        disabled,
      }}
    >
      <div ref={containerRef} className="relative inline-block w-full text-left">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

export function SelectTrigger({
  children,
  className,
  id,
  ...props
}: SelectTriggerProps) {
  const { isOpen, setIsOpen, disabled } = useSelectContext();

  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground cursor-pointer gap-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
        {children}
      </div>
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, selectedLabel } = useSelectContext();

  if (selectedLabel !== null && selectedLabel !== undefined) {
    return <span className="truncate">{selectedLabel}</span>;
  }

  return <span className="text-muted-foreground truncate">{value || placeholder}</span>;
}

export function SelectContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 p-1 space-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value: itemValue, children, className }: SelectItemProps) {
  const { value, onValueChange, setIsOpen, setSelectedLabel } = useSelectContext();
  const isSelected = value === itemValue;

  // Register label when selected
  React.useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  const handleSelect = () => {
    onValueChange?.(itemValue);
    setSelectedLabel(children);
    setIsOpen(false);
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent/70 font-medium text-accent-foreground",
        className
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}
