import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Edit3, 
  Move, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Plus, 
  Trash2,
  Settings2,
  GripVertical,
  Check,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'switch';
  required: boolean;
  visible: boolean;
  order: number;
  options?: string[];
  placeholder?: string;
  section?: string;
  width?: 'full' | 'half' | 'third';
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FieldLayout {
  id: string;
  name: string;
  fields: FieldConfig[];
  sections: {
    id: string;
    name: string;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface SortableFieldProps {
  field: FieldConfig;
  isEditing: boolean;
  onEdit: (field: FieldConfig) => void;
  onToggleVisibility: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
}

const SortableField: React.FC<SortableFieldProps> = ({ 
  field, 
  isEditing, 
  onEdit, 
  onToggleVisibility,
  onDelete 
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(field.label);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleLabelSave = () => {
    onEdit({ ...field, label: tempLabel });
    setIsEditingLabel(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative p-4 bg-white rounded-lg border-2 
        ${isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        ${!field.visible ? 'opacity-50' : ''}
        transition-all duration-200
      `}
    >
      <div className="flex items-center gap-3">
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-move hover:text-blue-600 transition-colors"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          {isEditingLabel ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLabelSave();
                  if (e.key === 'Escape') {
                    setTempLabel(field.label);
                    setIsEditingLabel(false);
                  }
                }}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleLabelSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setTempLabel(field.label);
                  setIsEditingLabel(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium">{field.label}</span>
              {field.required && <Badge variant="secondary">Required</Badge>}
              <Badge variant="outline">{field.type}</Badge>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingLabel(true)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-1">
            Field ID: {field.name} | Section: {field.section || 'main'}
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleVisibility(field.id)}
            >
              {field.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(field.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isEditing && field.type === 'select' && field.options && (
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <Label className="text-xs">Options:</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {field.options.map((opt, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {opt}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface FieldEditorProps {
  fields: FieldConfig[];
  onSave: (fields: FieldConfig[]) => void;
  onCancel: () => void;
  title?: string;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  fields: initialFields,
  onSave,
  onCancel,
  title = "Field Editor"
}) => {
  const [fields, setFields] = useState<FieldConfig[]>(initialFields);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const hasAnyChange = JSON.stringify(fields) !== JSON.stringify(initialFields);
    setHasChanges(hasAnyChange);
  }, [fields, initialFields]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers
        return newItems.map((item, idx) => ({
          ...item,
          order: idx
        }));
      });
    }
    setActiveId(null);
  };

  const handleFieldEdit = (updatedField: FieldConfig) => {
    setFields(prev => prev.map(f => 
      f.id === updatedField.id ? updatedField : f
    ));
  };

  const handleToggleVisibility = (fieldId: string) => {
    setFields(prev => prev.map(f => 
      f.id === fieldId ? { ...f, visible: !f.visible } : f
    ));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleAddField = () => {
    const newField: FieldConfig = {
      id: `field_${Date.now()}`,
      name: `custom_field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      visible: true,
      order: fields.length,
      placeholder: '',
      section: 'main',
      width: 'full'
    };
    setFields(prev => [...prev, newField]);
  };

  const handleSave = () => {
    onSave(fields);
    toast.success('Field configuration saved successfully');
  };

  const handleReset = () => {
    setFields(initialFields);
    toast.info('Fields reset to original configuration');
  };

  const activeField = activeId ? fields.find(f => f.id === activeId) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 className="h-6 w-6 text-gray-600" />
              <CardTitle>{title}</CardTitle>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={hasChanges ? "destructive" : "secondary"}>
                {hasChanges ? 'Unsaved Changes' : 'No Changes'}
              </Badge>
              
              <Switch
                checked={isEditing}
                onCheckedChange={setIsEditing}
                id="edit-mode"
              />
              <Label htmlFor="edit-mode" className="cursor-pointer">
                Edit Mode
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            {isEditing && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Move className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Drag fields to reorder • Click labels to edit • Use eye icon to show/hide
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddField}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Advanced
                  </Button>
                </div>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {fields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      isEditing={isEditing}
                      onEdit={handleFieldEdit}
                      onToggleVisibility={handleToggleVisibility}
                      onDelete={handleDeleteField}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeField ? (
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-500 shadow-xl">
                    <div className="font-medium">{activeField.label}</div>
                    <div className="text-sm text-gray-500">
                      Moving field...
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {showAdvanced && (
            <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Advanced Field Configuration</DialogTitle>
                  <DialogDescription>
                    Configure field types, validation, and advanced options
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  {fields.map(field => (
                    <Card key={field.id} className="p-4">
                      <div className="space-y-3">
                        <div className="font-medium">{field.label}</div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: any) => 
                                handleFieldEdit({ ...field, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="switch">Switch</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Width</Label>
                            <Select
                              value={field.width || 'full'}
                              onValueChange={(value: any) => 
                                handleFieldEdit({ ...field, width: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full Width</SelectItem>
                                <SelectItem value="half">Half Width</SelectItem>
                                <SelectItem value="third">Third Width</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {field.type === 'select' && (
                          <div>
                            <Label>Options (comma separated)</Label>
                            <Input
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => {
                                const options = e.target.value
                                  .split(',')
                                  .map(opt => opt.trim())
                                  .filter(opt => opt);
                                handleFieldEdit({ ...field, options });
                              }}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => 
                              handleFieldEdit({ ...field, required: checked })
                            }
                          />
                          <Label>Required Field</Label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to load/save field configurations
export const useFieldConfiguration = (formName: string) => {
  const storageKey = `nbslims_field_config_${formName}`;
  
  const loadConfiguration = (): FieldConfig[] | null => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error loading field configuration:', error);
      }
    }
    return null;
  };

  const saveConfiguration = (fields: FieldConfig[]) => {
    localStorage.setItem(storageKey, JSON.stringify(fields));
  };

  const resetConfiguration = () => {
    localStorage.removeItem(storageKey);
  };

  return {
    loadConfiguration,
    saveConfiguration,
    resetConfiguration
  };
};

export default FieldEditor;
