import React from "react";
import { Search } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  iconPosition = "left",
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && iconPosition === "left" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full py-2.5 bg-surface-container-lowest border-none rounded-md
            text-sm text-on-surface placeholder:text-on-surface-variant/50
            focus:ring-2 focus:ring-primary-fixed focus:bg-white
            transition-all outline-none
            ${icon && iconPosition === "left" ? "pl-10" : "pl-4"}
            ${icon && iconPosition === "right" ? "pr-10" : "pr-4"}
            ${error ? "ring-2 ring-error" : ""}
            ${className}
          `}
          {...props}
        />
        {icon && iconPosition === "right" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
      </div>
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
};

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  containerClassName = "",
  className = "",
  ...props
}) => {
  return (
    <div className={`relative group ${containerClassName}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
        <Search size={18} />
      </span>
      <input
        className={`
          w-full py-2.5 pl-10 pr-4 bg-surface-container-low border-none rounded-md
          text-sm text-on-surface placeholder:text-on-surface-variant/50
          focus:ring-2 focus:ring-primary-fixed focus:bg-white
          transition-all outline-none
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </label>
      )}
      <select
        className={`
          bg-surface-container-lowest border-none text-sm py-2.5 px-4 rounded-md
          focus:ring-2 focus:ring-primary-fixed
          transition-all outline-none cursor-pointer text-on-surface
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export { Input, SearchInput, Select };
