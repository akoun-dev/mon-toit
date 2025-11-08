import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showValidation?: boolean;
  isValid?: boolean;
  hasError?: boolean;
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, type, label, showValidation = false, isValid = false, hasError = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const isLabelFloating = isFocused || hasValue || !!props.value || !!props.defaultValue;

    return (
      <motion.div 
        className="relative"
        animate={hasError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <input
          type={type}
          className={cn(
            "peer flex h-12 w-full rounded-md border-2 border-input bg-background px-3 pt-5 pb-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showValidation && isValid && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",
            hasError && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
            className,
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          {...props}
        />
        
        {label && (
          <motion.label
            htmlFor={props.id}
            className={cn(
              "absolute left-3 text-muted-foreground pointer-events-none transition-all duration-200 origin-left",
              isLabelFloating 
                ? "top-1.5 text-xs font-medium" 
                : "top-1/2 -translate-y-1/2 text-base"
            )}
            animate={{
              scale: isLabelFloating ? 0.85 : 1,
              color: isFocused ? "rgb(220, 38, 38)" : "rgb(115, 115, 115)",
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {label}
          </motion.label>
        )}

        {/* Icône de validation avec bounce */}
        <AnimatePresence>
          {showValidation && isValid && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 15 
              }}
            >
              <Check className="h-5 w-5 text-green-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);
FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
