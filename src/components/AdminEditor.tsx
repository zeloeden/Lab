import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Settings,
  Save,
  X
} from 'lucide-react';
import { CustomColumn, CustomSection, EditorMode } from '@/lib/types';
import { toast } from 'sonner';

interface AdminEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editorMode: EditorMode) => void;
  initialMode?: EditorMode;
}

export const AdminEditor: React.FC<AdminEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMode
}) => {
  const [editorMode, setEditorMode] = useState<EditorMode>({
    enabled: false,
    customSections: [],
    customColumns: []
  });

  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [editingColumn, setEditingColumn] = useState<CustomColumn | null>(null);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);

  const [columnForm, setColumnForm] = useState({
    name: '',
    type: 'text' as const,
    required: false,
    options: [] as string[],
    defaultValue: '',
    visible: true
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    visible: true
  });

  useEffect(() => {
    if (initialMode) {
      setEditorMode(initialMode);
    }
  }, [initialMode]);

  const handleAddColumn = () => {
    setEditingColumn(null);
    setColumnForm({
      name: '',
      type: 'text',
      required: false,
      options: [],
      defaultValue: '',
      visible: true
    });
    setShowColumnDialog(true);
  };

  const handleEditColumn = (column: CustomColumn) => {
    setEditingColumn(column);
    setColumnForm({
      name: column.name,
      type: column.type,
      required: column.required,
      options: column.options || [],
      defaultValue: column.defaultValue || '',
      visible: column.visible
    });
    setShowColumnDialog(true);
  };

  const handleSaveColumn = () => {
    if (!columnForm.name.trim()) {
      toast.error('Column name is required');
      return;
    }

    const newColumn: CustomColumn = {
      id: editingColumn?.id || `column-${Date.now()}`,
      name: columnForm.name,
      type: columnForm.type,
      required: columnForm.required,
      options: columnForm.type === 'select' || columnForm.type === 'multiselect' ? columnForm.options : undefined,
      defaultValue: columnForm.defaultValue || undefined,
      order: editingColumn?.order || editorMode.customColumns.length,
      visible: columnForm.visible
    };

    if (editingColumn) {
      setEditorMode(prev => ({
        ...prev,
        customColumns: prev.customColumns.map(col => col.id === editingColumn.id ? newColumn : col)
      }));
    } else {
      setEditorMode(prev => ({
        ...prev,
        customColumns: [...prev.customColumns, newColumn]
      }));
    }

    setShowColumnDialog(false);
    toast.success('Column saved successfully');
  };

  const handleDeleteColumn = (columnId: string) => {
    setEditorMode(prev => ({
      ...prev,
      customColumns: prev.customColumns.filter(col => col.id !== columnId)
    }));
    toast.success('Column deleted');
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionForm({
      name: '',
      description: '',
      visible: true
    });
    setShowSectionDialog(true);
  };

  const handleEditSection = (section: CustomSection) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      description: section.description || '',
      visible: section.visible
    });
    setShowSectionDialog(true);
  };

  const handleSaveSection = () => {
    if (!sectionForm.name.trim()) {
      toast.error('Section name is required');
      return;
    }

    const newSection: CustomSection = {
      id: editingSection?.id || `section-${Date.now()}`,
      name: sectionForm.name,
      description: sectionForm.description,
      columns: editingSection?.columns || [],
      order: editingSection?.order || editorMode.customSections.length,
      visible: sectionForm.visible
    };

    if (editingSection) {
      setEditorMode(prev => ({
        ...prev,
        customSections: prev.customSections.map(sec => sec.id === editingSection.id ? newSection : sec)
      }));
    } else {
      setEditorMode(prev => ({
        ...prev,
        customSections: [...prev.customSections, newSection]
      }));
    }

    setShowSectionDialog(false);
    toast.success('Section saved successfully');
  };

  const handleDeleteSection = (sectionId: string) => {
    setEditorMode(prev => ({
      ...prev,
      customSections: prev.customSections.filter(sec => sec.id !== sectionId)
    }));
    toast.success('Section deleted');
  };

  const handleSave = () => {
    onSave(editorMode);
    toast.success('Editor mode configuration saved');
    onClose();
  };

  const getColumnTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'select': return '📋';
      case 'multiselect': return '📋';
      case 'boolean': return '☑️';
      default: return '📝';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Editor Mode
          </DialogTitle>
          <DialogDescription>
            Configure custom columns and sections for the sample management system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Editor Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Editor Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="editor-enabled">Enable Editor Mode</Label>
                <input
                  id="editor-enabled"
                  type="checkbox"
                  checked={editorMode.enabled}
                  onChange={(e) => setEditorMode(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Badge variant={editorMode.enabled ? "default" : "secondary"}>
                  {editorMode.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Custom Columns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Columns</CardTitle>
                <Button onClick={handleAddColumn} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {editorMode.customColumns.map((column) => (
                  <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{getColumnTypeIcon(column.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{column.name}</div>
                      <div className="text-sm text-gray-500">
                        {column.type} {column.required && '(Required)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditorMode(prev => ({
                          ...prev,
                          customColumns: prev.customColumns.map(col => 
                            col.id === column.id ? { ...col, visible: !col.visible } : col
                          )
                        }))}
                      >
                        {column.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditColumn(column)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {editorMode.customColumns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No custom columns defined. Click "Add Column" to create one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Sections */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Sections</CardTitle>
                <Button onClick={handleAddSection} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {editorMode.customSections.map((section) => (
                  <div key={section.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">{section.name}</div>
                      {section.description && (
                        <div className="text-sm text-gray-500">{section.description}</div>
                      )}
                      <div className="text-sm text-gray-500">
                        {section.columns.length} columns
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditorMode(prev => ({
                          ...prev,
                          customSections: prev.customSections.map(sec => 
                            sec.id === section.id ? { ...sec, visible: !sec.visible } : sec
                          )
                        }))}
                      >
                        {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSection(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {editorMode.customSections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No custom sections defined. Click "Add Section" to create one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>

        {/* Column Dialog */}
        <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingColumn ? 'Edit Column' : 'Add Column'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="column-name">Column Name</Label>
                <Input
                  id="column-name"
                  value={columnForm.name}
                  onChange={(e) => setColumnForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter column name"
                />
              </div>
              <div>
                <Label htmlFor="column-type">Column Type</Label>
                <Select
                  value={columnForm.type}
                  onValueChange={(value: any) => setColumnForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="multiselect">Multi-Select</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(columnForm.type === 'select' || columnForm.type === 'multiselect') && (
                <div>
                  <Label htmlFor="column-options">Options (one per line)</Label>
                  <Textarea
                    id="column-options"
                    value={columnForm.options.join('\n')}
                    onChange={(e) => setColumnForm(prev => ({ 
                      ...prev, 
                      options: e.target.value.split('\n').filter(opt => opt.trim()) 
                    }))}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="column-required"
                    checked={columnForm.required}
                    onChange={(e) => setColumnForm(prev => ({ ...prev, required: e.target.checked }))}
                  />
                  <Label htmlFor="column-required">Required</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="column-visible"
                    checked={columnForm.visible}
                    onChange={(e) => setColumnForm(prev => ({ ...prev, visible: e.target.checked }))}
                  />
                  <Label htmlFor="column-visible">Visible</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowColumnDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveColumn}>
                Save Column
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section Dialog */}
        <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Edit Section' : 'Add Section'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-name">Section Name</Label>
                <Input
                  id="section-name"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter section name"
                />
              </div>
              <div>
                <Label htmlFor="section-description">Description</Label>
                <Textarea
                  id="section-description"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter section description"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="section-visible"
                  checked={sectionForm.visible}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, visible: e.target.checked }))}
                />
                <Label htmlFor="section-visible">Visible</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSection}>
                Save Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

