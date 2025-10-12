import { EnhancedLabelTemplate, createEmptyTemplate, parseTemplateVariables } from '@/lib/label-model';

class LabelTemplateService {
  private storageKey = 'nbslims_label_templates';

  // Get all templates
  getTemplates(): EnhancedLabelTemplate[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading label templates:', error);
      return [];
    }
  }

  // Get template by ID
  getTemplate(id: string): EnhancedLabelTemplate | null {
    const templates = this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  // Save template
  saveTemplate(template: EnhancedLabelTemplate): void {
    try {
      const templates = this.getTemplates();
      const existingIndex = templates.findIndex(t => t.id === template.id);
      
      if (existingIndex >= 0) {
        // Update existing template
        templates[existingIndex] = {
          ...template,
          updatedAt: new Date(),
          version: template.version + 1
        };
      } else {
        // Add new template
        templates.push(template);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving label template:', error);
      throw error;
    }
  }

  // Delete template
  deleteTemplate(id: string): void {
    try {
      const templates = this.getTemplates();
      const filtered = templates.filter(t => t.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting label template:', error);
      throw error;
    }
  }

  // Create new template
  createTemplate(name: string): EnhancedLabelTemplate {
    const template = createEmptyTemplate(name);
    this.saveTemplate(template);
    return template;
  }

  // Duplicate template
  duplicateTemplate(id: string, newName: string): EnhancedLabelTemplate | null {
    const original = this.getTemplate(id);
    if (!original) return null;

    const duplicate: EnhancedLabelTemplate = {
      ...original,
      id: `template_${Date.now()}`,
      name: newName,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      elements: original.elements.map(el => ({
        ...el,
        id: `${el.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    this.saveTemplate(duplicate);
    return duplicate;
  }

  // Update template elements
  updateTemplateElements(id: string, elements: EnhancedLabelTemplate['elements']): void {
    const template = this.getTemplate(id);
    if (!template) return;

    // Extract variables from all elements
    const variables = new Set<string>();
    elements.forEach(element => {
      if (element.type === 'text') {
        parseTemplateVariables(element.content).forEach(v => variables.add(v));
      } else if (element.type === 'barcode' || element.type === 'qr') {
        parseTemplateVariables(element.value).forEach(v => variables.add(v));
      }
    });

    const updatedTemplate: EnhancedLabelTemplate = {
      ...template,
      elements,
      variables: Array.from(variables),
      updatedAt: new Date(),
      version: template.version + 1
    };

    this.saveTemplate(updatedTemplate);
  }

  // Update template styles
  updateTemplateStyles(id: string, styles: Record<string, any>): void {
    const template = this.getTemplate(id);
    if (!template) return;

    const updatedTemplate: EnhancedLabelTemplate = {
      ...template,
      styles: { ...template.styles, ...styles },
      updatedAt: new Date(),
      version: template.version + 1
    };

    this.saveTemplate(updatedTemplate);
  }

  // Update template size
  updateTemplateSize(id: string, size: EnhancedLabelTemplate['size']): void {
    const template = this.getTemplate(id);
    if (!template) return;

    const updatedTemplate: EnhancedLabelTemplate = {
      ...template,
      size,
      updatedAt: new Date(),
      version: template.version + 1
    };

    this.saveTemplate(updatedTemplate);
  }

  // Export template as JSON
  exportTemplate(id: string): string {
    const template = this.getTemplate(id);
    if (!template) throw new Error('Template not found');

    return JSON.stringify(template, null, 2);
  }

  // Import template from JSON
  importTemplate(jsonString: string): EnhancedLabelTemplate {
    try {
      const template = JSON.parse(jsonString) as EnhancedLabelTemplate;
      
      // Validate required fields
      if (!template.id || !template.name || !template.size || !template.elements) {
        throw new Error('Invalid template format');
      }

      // Generate new ID to avoid conflicts
      template.id = `template_${Date.now()}`;
      template.createdAt = new Date();
      template.updatedAt = new Date();
      template.version = 1;

      // Generate new IDs for elements
      template.elements = template.elements.map(el => ({
        ...el,
        id: `${el.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));

      this.saveTemplate(template);
      return template;
    } catch (error) {
      console.error('Error importing template:', error);
      throw new Error('Failed to import template');
    }
  }

  // Get template statistics
  getTemplateStats(id: string): {
    elementCount: number;
    variableCount: number;
    styleCount: number;
    lastModified: Date;
  } | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    return {
      elementCount: template.elements.length,
      variableCount: template.variables?.length || 0,
      styleCount: Object.keys(template.styles || {}).length,
      lastModified: template.updatedAt
    };
  }
}

export const labelTemplateService = new LabelTemplateService();
