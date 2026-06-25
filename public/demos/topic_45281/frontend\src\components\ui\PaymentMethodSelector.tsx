import React from "react";
import { Banknote, Smartphone, CreditCard, Wallet } from "lucide-react";

type PaymentType = "cash" | "wechat" | "alipay" | "card";

interface PaymentMethod {
  value: PaymentType;
  label: string;
  icon: typeof Banknote;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  { value: "cash", label: "现金", icon: Banknote, color: "text-green-600" },
  { value: "wechat", label: "微信", icon: Smartphone, color: "text-green-500" },
  { value: "alipay", label: "支付宝", icon: Wallet, color: "text-pink-500" },
  { value: "card", label: "银行卡", icon: CreditCard, color: "text-purple-600" },
];

interface PaymentMethodSelectorProps {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {paymentMethods.map((method) => {
        const IconComponent = method.icon;
        const isSelected = value === method.value;

        return (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-xl
              border transition-all duration-200
              ${
                isSelected
                  ? "bg-primary text-on-primary border-primary shadow-md scale-105"
                  : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low hover:border-primary/30"
              }
            `}
          >
            <IconComponent
              size={24}
              className={isSelected ? "text-on-primary" : method.color}
            />
            <span
              className={`text-sm font-bold ${isSelected ? "text-on-primary" : "text-on-surface"}`}
            >
              {method.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
export type { PaymentType };
