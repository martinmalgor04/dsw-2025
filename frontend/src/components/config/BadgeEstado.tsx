import React from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type EstadoType = "success" | "error" | "neutral" | "warning";

interface BadgeEstadoProps {
  estado: EstadoType;
  label: string;
  showIcon?: boolean;
}

export function BadgeEstado({ estado, label, showIcon = true }: BadgeEstadoProps) {
  const configs = {
    success: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      border: "border-emerald-300",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      icon: XCircle,
    },
    neutral: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-300",
      icon: AlertCircle,
    },
    warning: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-300",
      icon: AlertCircle,
    },
  };

  const config = configs[estado];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </span>
  );
}
