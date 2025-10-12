/**
 * Rich text editor for label editor
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  RotateCcw,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface RichTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic' | 'oblique';
  textDecoration: 'none' | 'underline' | 'line-through' | 'overline';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  backgroundColor: string;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

interface RichTextEditorProps {
  content: string;
  style: RichTextStyle;
  onContentChange: (content: string) => void;
  onStyleChange: (style: Partial<RichTextStyle>) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  style,
  onContentChange,
  onStyleChange,
  onClose,
  isVisible
}) => {
  const [localContent, setLocalContent] = useState(content);
  const [localStyle, setLocalStyle] = useState(style);
  const [activeTab, setActiveTab] = useState<'content' | 'format' | 'advanced'>('content');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContent(content);
    setLocalStyle(style);
  }, [content, style]);

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    onContentChange(value);
  };

  const handleStyleChange = (updates: Partial<RichTextStyle>) => {
    const newStyle = { ...localStyle, ...updates };
    setLocalStyle(newStyle);
    onStyleChange(updates);
  };

  const handleBold = () => {
    handleStyleChange({
      fontWeight: localStyle.fontWeight === 'bold' ? 'normal' : 'bold'
    });
  };

  const handleItalic = () => {
    handleStyleChange({
      fontStyle: localStyle.fontStyle === 'italic' ? 'normal' : 'italic'
    });
  };

  const handleUnderline = () => {
    handleStyleChange({
      textDecoration: localStyle.textDecoration === 'underline' ? 'none' : 'underline'
    });
  };

  const handleStrikethrough = () => {
    handleStyleChange({
      textDecoration: localStyle.textDecoration === 'line-through' ? 'none' : 'line-through'
    });
  };

  const handleTextAlign = (align: RichTextStyle['textAlign']) => {
    handleStyleChange({ textAlign: align });
  };

  const handleTextTransform = (transform: RichTextStyle['textTransform']) => {
    handleStyleChange({ textTransform: transform });
  };

  const handleFontFamily = (fontFamily: string) => {
    handleStyleChange({ fontFamily });
  };

  const handleFontSize = (fontSize: number) => {
    handleStyleChange({ fontSize });
  };

  const handleColor = (color: string) => {
    handleStyleChange({ color });
  };

  const handleBackgroundColor = (backgroundColor: string) => {
    handleStyleChange({ backgroundColor });
  };

  const handleLetterSpacing = (letterSpacing: number) => {
    handleStyleChange({ letterSpacing });
  };

  const handleLineHeight = (lineHeight: number) => {
    handleStyleChange({ lineHeight });
  };

  const handleReset = () => {
    const defaultStyle: RichTextStyle = {
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      color: '#000000',
      backgroundColor: 'transparent',
      letterSpacing: 0,
      lineHeight: 1.2,
      textTransform: 'none'
    };
    setLocalStyle(defaultStyle);
    onStyleChange(defaultStyle);
  };

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
    'Comic Sans MS'
  ];

  const fontWeightOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
    { value: '300', label: '300' },
    { value: '400', label: '400' },
    { value: '500', label: '500' },
    { value: '600', label: '600' },
    { value: '700', label: '700' },
    { value: '800', label: '800' },
    { value: '900', label: '900' }
  ];

  const textAlignOptions = [
    { value: 'left', label: 'Left', icon: AlignLeft },
    { value: 'center', label: 'Center', icon: AlignCenter },
    { value: 'right', label: 'Right', icon: AlignRight },
    { value: 'justify', label: 'Justify', icon: AlignJustify }
  ];

  const textTransformOptions = [
    { value: 'none', label: 'None' },
    { value: 'uppercase', label: 'UPPERCASE' },
    { value: 'lowercase', label: 'lowercase' },
    { value: 'capitalize', label: 'Capitalize' }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Type className="h-5 w-5" />
            Rich Text Editor
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format Buttons */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <Button
                variant={localStyle.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={handleBold}
                className="h-8 w-8 p-0"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={localStyle.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={handleItalic}
                className="h-8 w-8 p-0"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={localStyle.textDecoration === 'underline' ? 'default' : 'outline'}
                size="sm"
                onClick={handleUnderline}
                className="h-8 w-8 p-0"
                title="Underline"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                variant={localStyle.textDecoration === 'line-through' ? 'default' : 'outline'}
                size="sm"
                onClick={handleStrikethrough}
                className="h-8 w-8 p-0"
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              {textAlignOptions.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={localStyle.textAlign === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTextAlign(option.value as RichTextStyle['textAlign'])}
                    className="h-8 w-8 p-0"
                    title={option.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>

            {/* Font Family */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Font:</Label>
              <Select value={localStyle.fontFamily} onValueChange={handleFontFamily}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font} value={font} className="text-xs">
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Size:</Label>
              <Input
                type="number"
                value={localStyle.fontSize}
                onChange={(e) => handleFontSize(parseFloat(e.target.value) || 12)}
                className="w-16 h-8 text-xs"
                min="1"
                max="200"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Text Content</Label>
                  <textarea
                    ref={textareaRef}
                    value={localContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your text content here..."
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Preview</Label>
                  <div 
                    className="w-full min-h-16 p-3 border border-gray-300 rounded-md bg-gray-50"
                    style={{
                      fontFamily: localStyle.fontFamily,
                      fontSize: `${localStyle.fontSize}px`,
                      fontWeight: localStyle.fontWeight,
                      fontStyle: localStyle.fontStyle,
                      textDecoration: localStyle.textDecoration,
                      textAlign: localStyle.textAlign,
                      color: localStyle.color,
                      backgroundColor: localStyle.backgroundColor === 'transparent' ? 'transparent' : localStyle.backgroundColor,
                      letterSpacing: `${localStyle.letterSpacing}px`,
                      lineHeight: localStyle.lineHeight,
                      textTransform: localStyle.textTransform
                    }}
                  >
                    {localContent || 'Preview text will appear here...'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="format" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Font Weight</Label>
                    <Select value={localStyle.fontWeight} onValueChange={(value) => handleStyleChange({ fontWeight: value as any })}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fontWeightOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Text Transform</Label>
                    <Select value={localStyle.textTransform} onValueChange={(value) => handleTextTransform(value as any)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {textTransformOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={localStyle.color}
                        onChange={(e) => handleColor(e.target.value)}
                        className="h-8 w-16"
                      />
                      <Input
                        value={localStyle.color}
                        onChange={(e) => handleColor(e.target.value)}
                        className="h-8 flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Background Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={localStyle.backgroundColor === 'transparent' ? '#ffffff' : localStyle.backgroundColor}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                        className="h-8 w-16"
                      />
                      <Input
                        value={localStyle.backgroundColor}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                        className="h-8 flex-1"
                        placeholder="transparent or #ffffff"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Letter Spacing (px)</Label>
                    <Input
                      type="number"
                      value={localStyle.letterSpacing}
                      onChange={(e) => handleLetterSpacing(parseFloat(e.target.value) || 0)}
                      className="h-8"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Line Height</Label>
                    <Input
                      type="number"
                      value={localStyle.lineHeight}
                      onChange={(e) => handleLineHeight(parseFloat(e.target.value) || 1.2)}
                      className="h-8"
                      step="0.1"
                      min="0.5"
                      max="3"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Advanced text formatting options will be available here in future updates.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
