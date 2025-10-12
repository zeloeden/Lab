import { useEffect, useRef } from 'react';

interface FieldHighlightOptions {
  errors: Record<string, string>;
  requiredFields: string[];
  highlightColor?: string;
  pulseAnimation?: boolean;
}

export const useFieldHighlight = ({
  errors,
  requiredFields,
  highlightColor = '#ef4444',
  pulseAnimation = true
}: FieldHighlightOptions) => {
  const highlightedFields = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clear previous highlights
    highlightedFields.current.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.classList.remove('field-error', 'field-required', 'pulse-error');
        element.style.removeProperty('box-shadow');
        element.style.removeProperty('border-color');
      }
    });
    highlightedFields.current.clear();

    // Add error highlights
    Object.keys(errors).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.classList.add('field-error');
        if (pulseAnimation) {
          element.classList.add('pulse-error');
        }
        element.style.borderColor = highlightColor;
        element.style.boxShadow = `0 0 0 3px ${highlightColor}20`;
        highlightedFields.current.add(fieldId);
      }
    });

    // Add required field highlights
    requiredFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element && !errors[fieldId]) {
        const isEmpty = (element as HTMLInputElement).value === '' || 
                       (element as HTMLSelectElement).value === '';
        
        if (isEmpty) {
          element.classList.add('field-required');
          element.style.borderColor = '#f59e0b';
          element.style.boxShadow = '0 0 0 2px #f59e0b20';
          highlightedFields.current.add(fieldId);
        }
      }
    });

    // Add CSS animations if not already present
    if (!document.getElementById('field-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'field-highlight-styles';
      style.textContent = `
        .field-error {
          animation: ${pulseAnimation ? 'pulse-error 2s infinite' : 'none'};
        }
        
        .field-required {
          position: relative;
        }
        
        .field-required::after {
          content: '*';
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: #f59e0b;
          font-weight: bold;
          pointer-events: none;
        }
        
        @keyframes pulse-error {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .highlight-missing {
          background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
          border-left: 4px solid #f59e0b;
          padding-left: 8px;
          margin-left: -12px;
          animation: highlight-flash 3s ease-in-out;
        }
        
        @keyframes highlight-flash {
          0%, 100% { background: transparent; }
          20%, 80% { background: linear-gradient(90deg, #fef3c7 0%, transparent 100%); }
        }
      `;
      document.head.appendChild(style);
    }
  }, [errors, requiredFields, highlightColor, pulseAnimation]);

  const scrollToFirstError = () => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        element.focus();
      }
    }
  };

  const highlightMissingFields = (missingFields: string[]) => {
    missingFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.classList.add('highlight-missing');
        setTimeout(() => {
          element.classList.remove('highlight-missing');
        }, 3000);
      }
    });

    // Scroll to first missing field
    if (missingFields.length > 0) {
      const firstField = document.getElementById(missingFields[0]);
      if (firstField) {
        firstField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        firstField.focus();
      }
    }
  };

  return {
    scrollToFirstError,
    highlightMissingFields
  };
};

// Higher-order component for automatic field highlighting
export const withFieldHighlight = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P & { errors?: Record<string, string>; requiredFields?: string[] }) => {
    const { errors = {}, requiredFields = [], ...componentProps } = props;
    
    useFieldHighlight({
      errors,
      requiredFields,
      highlightColor: '#ef4444',
      pulseAnimation: true
    });

    return <Component {...(componentProps as P)} />;
  };
};
