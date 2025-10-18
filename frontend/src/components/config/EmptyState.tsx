import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "../ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const glassStyle = {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  };

  return (
    <div 
      className="flex flex-col items-center justify-center p-12 rounded-xl text-center"
      style={glassStyle}
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-teal-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
