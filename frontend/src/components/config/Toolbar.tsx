import React from "react";
import { Search, Plus, Filter, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewClick: () => void;
  newButtonLabel?: string;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
  }[];
  showFilters?: boolean;
}

export function Toolbar({
  searchValue,
  onSearchChange,
  onNewClick,
  newButtonLabel = "Nuevo",
  filters = [],
  showFilters = true,
}: ToolbarProps) {
  const glassStyle = {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  };

  return (
    <div 
      className="p-4 rounded-xl mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between"
      style={glassStyle}
    >
      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
        {/* Buscador */}
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600/50" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/80 border-purple-200/50 focus:border-purple-400 transition-colors text-black"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros */}
        {showFilters && filters.map((filter, idx) => (
          <Select
            key={idx}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-white/80 border-purple-200/50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600/50" />
                <SelectValue placeholder={filter.label} />
              </div>
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Botón Nuevo */}
      <Button
        onClick={onNewClick}
        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white shadow-lg"
      >
        <Plus className="w-4 h-4 mr-2" />
        {newButtonLabel}
      </Button>
    </div>
  );
}
