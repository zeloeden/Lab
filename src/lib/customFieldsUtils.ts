// Utility functions for managing custom fields

export interface CustomFieldOption {
  name: string;
  value: string;
}

export const getCustomFieldOptions = (fieldType: string): CustomFieldOption[] => {
  try {
    const storedFields = localStorage.getItem('nbslims_custom_fields');
    if (!storedFields) return [];
    
    const customFields = JSON.parse(storedFields);
    return customFields
      .filter((field: any) => field.fieldType === fieldType && field.active)
      .sort((a: any, b: any) => a.order - b.order)
      .map((field: any) => ({ name: field.name, value: field.value }));
  } catch (error) {
    console.error('Error loading custom fields:', error);
    return [];
  }
};

// Default fallback options if custom fields are not available
export const getDefaultOptions = (fieldType: string): CustomFieldOption[] => {
  switch (fieldType) {
    case 'item-group':
      return [
        { name: 'Detergent', value: 'detergent' },
        { name: 'Sky Project', value: 'sky-project' },
        { name: 'Reed Diffuser', value: 'reed-diffuser' },
        { name: 'Personal', value: 'personal' }
      ];
      
    case 'sample-status':
      return [
        { name: 'Untested', value: 'Untested' },
        { name: 'Pending', value: 'Pending' },
        { name: 'Testing', value: 'Testing' },
        { name: 'Accepted', value: 'Accepted' },
        { name: 'Rejected', value: 'Rejected' }
      ];
      
    case 'test-type':
      return [
        { name: 'Personal Use', value: 'Personal Use' },
        { name: 'Industrial', value: 'Industrial' }
      ];
      
    case 'test-result':
      return [
        { name: 'Accepted', value: 'Accepted' },
        { name: 'Rejected', value: 'Rejected' },
        { name: 'Rework', value: 'Rework' },
        { name: 'Retest', value: 'Retest' }
      ];
      
    case 'test-priority':
      return [
        { name: 'Low', value: 'Low' },
        { name: 'Medium', value: 'Medium' },
        { name: 'High', value: 'High' }
      ];
      
    case 'formula-status':
      return [
        { name: 'Approved', value: 'Approved' },
        { name: 'Rejected', value: 'Rejected' },
        { name: 'Retest', value: 'Retest' }
      ];
      
    case 'currency':
      return [
        { name: 'USD', value: 'USD' },
        { name: 'EUR', value: 'EUR' },
        { name: 'GBP', value: 'GBP' },
        { name: 'AED', value: 'AED' }
      ];
      
    case 'carrier':
      return [
        { name: 'DHL Express', value: 'dhl' },
        { name: 'FedEx', value: 'fedex' },
        { name: 'UPS', value: 'ups' },
        { name: 'Aramex', value: 'aramex' },
        { name: 'Emirates Post', value: 'emirates-post' }
      ];
      
    case 'label-size':
      return [
        { name: 'Small (25mm x 13mm)', value: 'small' },
        { name: 'Standard (38mm x 25mm)', value: 'standard' },
        { name: 'Large (50mm x 30mm)', value: 'large' }
      ];
      
    case 'label-format':
      return [
        { name: 'QR Code + Text', value: 'qr-code' },
        { name: 'Barcode + Text', value: 'barcode' },
        { name: 'Text Only', value: 'text-only' }
      ];
      
    case 'task-priority':
      return [
        { name: 'Low', value: 'low' },
        { name: 'Medium', value: 'medium' },
        { name: 'High', value: 'high' }
      ];
      
    case 'task-status':
      return [
        { name: 'Pending', value: 'pending' },
        { name: 'In Progress', value: 'in-progress' },
        { name: 'Completed', value: 'completed' },
        { name: 'Overdue', value: 'overdue' }
      ];
      
    case 'unit-measure':
      return [
        { name: 'Units', value: 'units' },
        { name: 'Kilogram', value: 'kg' },
        { name: 'Liter', value: 'L' }
      ];
      
    case 'priority-shipping':
      return [
        { name: 'Air', value: 'Air' },
        { name: 'Sea', value: 'Sea' },
        { name: 'Land', value: 'Land' }
      ];
      
    case 'purpose-tag':
      return [
        { name: 'Requested', value: 'Requested' },
        { name: 'To fill the container with', value: 'To fill the container with' }
      ];
      
    case 'request-status':
      return [
        { name: 'Requested', value: 'Requested' },
        { name: 'Sent to Ordering', value: 'Sent to Ordering' },
        { name: 'Ordered', value: 'Ordered' }
      ];
      
    case 'font-family':
      return [
        { name: 'Arial', value: 'Arial' },
        { name: 'Helvetica', value: 'Helvetica' },
        { name: 'Times New Roman', value: 'Times New Roman' },
        { name: 'Courier New', value: 'Courier New' },
        { name: 'Georgia', value: 'Georgia' }
      ];
      
    case 'ledger-priority':
      return [
        { name: '🟢 Low', value: 'Low' },
        { name: '🟡 Medium', value: 'Medium' },
        { name: '🟠 High', value: 'High' },
        { name: '🔴 Critical', value: 'Critical' }
      ];

    case 'ledger-concept':
      return [
        { name: 'Signature Scent', value: 'Signature Scent' },
        { name: 'Seasonal Launch', value: 'Seasonal Launch' },
        { name: 'Limited Edition', value: 'Limited Edition' },
        { name: 'Mass Market', value: 'Mass Market' },
        { name: 'Premium Line', value: 'Premium Line' },
        { name: 'Niche Collection', value: 'Niche Collection' }
      ];

    case 'ledger-season':
      return [
        { name: 'Spring', value: 'spring' },
        { name: 'Summer', value: 'summer' },
        { name: 'Fall/Autumn', value: 'fall' },
        { name: 'Winter', value: 'winter' },
        { name: 'Year-round', value: 'year-round' }
      ];

    case 'main-brand':
      return [
        { name: 'Chanel', value: 'Chanel' },
        { name: 'Dior', value: 'Dior' },
        { name: 'Tom Ford', value: 'Tom Ford' },
        { name: 'Yves Saint Laurent', value: 'Yves Saint Laurent' },
        { name: 'Versace', value: 'Versace' },
        { name: 'Gucci', value: 'Gucci' },
        { name: 'Prada', value: 'Prada' },
        { name: 'Armani', value: 'Armani' }
      ];

    case 'branded-as':
      return [
        { name: 'ADF', value: 'ADF' },
        { name: 'Givaudan', value: 'Givaudan' },
        { name: 'Royal', value: 'Royal' }
      ];
      
    default:
      return [];
  }
};

// Combined function that gets custom fields with fallback to defaults
export const getFieldOptions = (fieldType: string): CustomFieldOption[] => {
  const customOptions = getCustomFieldOptions(fieldType);
  return customOptions.length > 0 ? customOptions : getDefaultOptions(fieldType);
};
