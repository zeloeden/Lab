import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type PriorityValue = "low" | "medium" | "high";

interface PrioritySelectorProps {
  value: PriorityValue;
  onChange: (value: PriorityValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const priorityOptions = [
  {
    value: "low" as const,
    label: "Low",
    icon: ShieldCheck,
    gradient: "from-green-400 to-green-600",
    shadow: "shadow-green-500/20"
  },
  {
    value: "medium" as const,
    label: "Medium", 
    icon: AlertCircle,
    gradient: "from-amber-400 to-yellow-500",
    shadow: "shadow-amber-500/20"
  },
  {
    value: "high" as const,
    label: "High",
    icon: AlertTriangle,
    gradient: "from-orange-400 to-orange-600",
    shadow: "shadow-orange-500/20"
  }
];

const PriorityBadge: React.FC<{ 
  option: typeof priorityOptions[0]; 
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
}> = ({ option, size = 'md', isSelected = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };
  
  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const Icon = option.icon;

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-gradient-to-br ${option.gradient}
        flex items-center justify-center
        transition-all duration-200
        flex-shrink-0
      `}
      style={{
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        boxShadow: `
          0 2px 4px ${option.shadow.replace('shadow-', '').replace('/20', '')}40,
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `
      }}
    >
      <Icon 
        className={`${iconSizeClasses[size]} text-white`}
      />
    </div>
  );
};

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select priority",
  disabled = false,
  className = ""
}) => {
  const selectedOption = priorityOptions.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} dir="ltr">
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={`
            w-full
            h-10
            px-3
            py-2
            bg-white
            border border-gray-200
            rounded-lg
            shadow-sm
            hover:bg-gray-50
            focus:bg-white
            focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-3 w-full">
            {selectedOption ? (
              <PriorityBadge option={selectedOption} size="sm" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300/50 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-gray-400/70" />
              </div>
            )}
            <span className="flex-1 text-left">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </SelectTrigger>
        
        <SelectContent 
          className={`
            w-full
            min-w-[200px]
            bg-white
            border border-gray-200
            rounded-lg
            shadow-lg
            p-1
            mt-1
          `}
        >
          {priorityOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={`
                flex items-center gap-3
                px-3 py-2
                rounded-md
                cursor-pointer
                hover:bg-gray-100
                focus:bg-gray-100
                transition-all duration-200
                data-[highlighted]:bg-gray-100
                data-[state=checked]:bg-blue-50
              `}
            >
              <PriorityBadge option={option} size="sm" />
              <span className="font-medium text-gray-800">
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Example usage component
export const PrioritySelectorExample: React.FC = () => {
  const [priority, setPriority] = React.useState<PriorityValue>("medium");

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Priority Selector Example
        </h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Select Priority Level
          </label>
          <PrioritySelector
            value={priority}
            onChange={setPriority}
            placeholder="Choose priority level"
          />
        </div>

        <div className="mt-4 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
          <h3 className="font-semibold text-gray-800 mb-2">Current Selection:</h3>
          <p className="text-gray-600">
            Priority: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {priority}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {priorityOptions.map((option) => (
            <div 
              key={option.value}
              className="flex items-center gap-3 p-3 bg-white/30 backdrop-blur-sm rounded-lg border border-white/20"
            >
              <PriorityBadge option={option} size="md" />
              <div>
                <p className="font-medium text-gray-800">{option.label}</p>
                <p className="text-sm text-gray-600 capitalize">{option.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrioritySelector;
