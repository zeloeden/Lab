/**
 * Variable parsing and substitution for label templates
 */

export interface VariableContext {
  [key: string]: any;
}

export interface ParsedVariable {
  fullMatch: string;
  variableName: string;
  defaultValue?: string;
  formatter?: string;
}

/**
 * Parse variables from text content
 */
export function parseVariables(content: string): ParsedVariable[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: ParsedVariable[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const variableContent = match[1].trim();
    
    // Parse variable name and optional default value
    const [variableName, ...rest] = variableContent.split('|');
    const defaultValue = rest.length > 0 ? rest.join('|') : undefined;
    
    // Check for formatter (e.g., {{name|uppercase}})
    const formatterMatch = variableName.match(/^(.+?):(.+)$/);
    const finalVariableName = formatterMatch ? formatterMatch[1] : variableName;
    const formatter = formatterMatch ? formatterMatch[2] : undefined;

    variables.push({
      fullMatch,
      variableName: finalVariableName.trim(),
      defaultValue,
      formatter
    });
  }

  return variables;
}

/**
 * Substitute variables in content with context values
 */
export function substituteVariables(content: string, context: VariableContext): string {
  const variables = parseVariables(content);
  let result = content;

  for (const variable of variables) {
    let value = context[variable.variableName];
    
    // Use default value if variable not found
    if (value === undefined || value === null) {
      value = variable.defaultValue || `{{${variable.variableName}}}`;
    }

    // Apply formatter if specified
    if (variable.formatter && typeof value === 'string') {
      value = applyFormatter(value, variable.formatter);
    }

    // Convert to string
    const stringValue = String(value);
    
    // Replace the variable
    result = result.replace(variable.fullMatch, stringValue);
  }

  return result;
}

/**
 * Apply formatter to value
 */
function applyFormatter(value: string, formatter: string): string {
  switch (formatter.toLowerCase()) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case 'trim':
      return value.trim();
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(parseFloat(value) || 0);
    case 'number':
      return new Intl.NumberFormat('en-US').format(parseFloat(value) || 0);
    default:
      return value;
  }
}

/**
 * Extract all unique variable names from content
 */
export function extractVariableNames(content: string): string[] {
  const variables = parseVariables(content);
  return [...new Set(variables.map(v => v.variableName))];
}

/**
 * Validate that all required variables are provided in context
 */
export function validateVariables(content: string, context: VariableContext): {
  isValid: boolean;
  missingVariables: string[];
  unusedVariables: string[];
} {
  const requiredVariables = extractVariableNames(content);
  const providedVariables = Object.keys(context);
  
  const missingVariables = requiredVariables.filter(
    variable => !providedVariables.includes(variable) && !context[variable]
  );
  
  const unusedVariables = providedVariables.filter(
    variable => !requiredVariables.includes(variable)
  );

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    unusedVariables
  };
}

/**
 * Create a sample context for testing
 */
export function createSampleContext(): VariableContext {
  return {
    productName: 'Sample Product',
    productCode: 'SP-001',
    price: 29.99,
    quantity: 100,
    date: new Date().toISOString(),
    supplier: 'ABC Company',
    batchNumber: 'BATCH-2024-001',
    expiryDate: '2025-12-31',
    barcode: '1234567890123',
    qrCode: 'https://example.com/product/SP-001',
    description: 'This is a sample product description',
    weight: '250g',
    dimensions: '10x15x5cm',
    color: 'Blue',
    material: 'Plastic'
  };
}
