import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

interface EnhancedInputProps extends React.ComponentProps<"input"> {
  validation?: {
    isValid: boolean;
    message: string;
    strength?: 'weak' | 'medium' | 'strong';
    wordCount?: number;
  };
  showValidation?: boolean;
  icon?: React.ReactNode;
  dir?: 'rtl' | 'ltr'; // Add direction prop
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, validation, showValidation = true, icon, dir = 'rtl', ...props }, ref) => {
    const isEmpty = typeof props.value === "string" && props.value.trim() === "";
    const hasValue = typeof props.value === "string" && props.value.trim() !== "";

    const getValidationColor = () => {
      if (isEmpty) return "border-gray-200 focus:border-bahthali-400 focus:ring-bahthali-400";
      
      if (validation) {
        if (!validation.isValid) return "border-gray-200 focus:border-bahthali-400 focus:ring-bahthali-400";
        return "border-gray-200 focus:border-bahthali-400 focus:ring-bahthali-400";
      }

      return "border-gray-200 focus:border-bahthali-400 focus:ring-bahthali-400";
    };

    const getBackgroundGradient = () => {
      return "";
    };

    return (
      <div className="space-y-2">
        <div className="relative group">
          {/* Icon (always on the right) */}
          {icon && (
            <div className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-bahthali-500`}>
              {icon}
            </div>
          )}

          <Input
            className={cn(
              "transition-all duration-300 ease-in-out transform",
              "hover:scale-[1.01] focus:scale-[1.01]",
              "shadow-sm hover:shadow-md",
              icon ? (dir === 'rtl' ? "pr-10" : "pl-10") : "",
              getValidationColor(),
              getBackgroundGradient(),
              className
            )}
            ref={ref}
            dir={dir} // Pass direction to input
            {...props}
          />
        </div>

        {validation && validation.message && !["تم", "يرجى إدخال اسم الأستاذ","يرجى إدخال عنوان البحث","يرجى إدخال اسم المقياس","يرجى إدخال المقياس","يرجى إدخال اسم الطالب","يرجى إدخال المستوى والتخصص", "يرجى إدخال اسم الكلية"].includes(validation.message.trim()) && (
          <div className="animate-fade-in">
            <div className={cn(
              "rounded-lg px-3 py-2 border transition-all duration-300",
              !validation.isValid
                ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
                : validation.strength === 'weak'
                  ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                  : validation.strength === 'medium'
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
                    : validation.strength === 'strong'
                      ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                      : "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    !validation.isValid ? "text-red-700" :
                      validation.strength === 'weak' ? "text-orange-700" :
                        validation.strength === 'medium' ? "text-blue-700" :
                          validation.strength === 'strong' ? "text-green-700" :
                            "text-green-700"
                  )}>
                    {validation.message}
                  </p>
                </div>
                
                {validation.strength && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        validation.strength === 'weak' ? "bg-orange-400 shadow-sm" : "bg-gray-200"
                      )}></div>
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        validation.strength === 'medium' ? "bg-blue-400 shadow-sm" : "bg-gray-200"
                      )}></div>
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        validation.strength === 'strong' ? "bg-green-400 shadow-sm" : "bg-gray-200"
                      )}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };