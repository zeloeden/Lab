# Label Editor Feature

A comprehensive label editing system for the NBS LIMS application, built with React, TypeScript, and Fabric.js.

## Features

### Core Functionality
- **Canvas-based Editor**: Full-featured canvas with rulers, guides, and grid
- **Element Management**: Text, shapes, images, barcodes, QR codes, tables, and variables
- **Precise Measurements**: Millimeter-based positioning with 300 DPI accuracy
- **Real-time Preview**: Live preview with data binding
- **Undo/Redo**: Full history management with keyboard shortcuts

### Design Tools
- **Text Editing**: Rich text with fonts, sizes, colors, alignment, and RTL support
- **Shape Tools**: Rectangles, circles, lines with customizable styling
- **Barcode Generation**: Code128, EAN-13, EAN-8, UPC-A support
- **QR Code Generation**: Customizable error correction levels
- **Table Component**: Dynamic pricing tables with configurable rows
- **Variable System**: Dynamic data binding with sample data

### Layout & Alignment
- **Snap to Grid**: Precise alignment with visual guides
- **Layer Management**: Z-index ordering, visibility, and locking
- **Grouping**: Group elements for easier management
- **Alignment Tools**: Align and distribute multiple elements
- **Transform Tools**: Rotate, flip, and scale elements

### Data Integration
- **Sample Data Binding**: Connect to existing sample database
- **Variable Replacement**: Dynamic content with `{{Variable}}` syntax
- **Preview Mode**: See how labels will look with real data
- **Multi-language Support**: Arabic and English text with RTL support

### Export & Printing
- **High-Quality Export**: PNG (300 DPI), SVG, and PDF formats
- **Exact Scale Printing**: CSS-based printing with precise measurements
- **Test Paper Generation**: Print alignment guides for testing
- **Template System**: Save and reuse label designs

## Usage

### Basic Integration

```tsx
import { LabelEditor } from '@/features/label-editor';

function MyComponent() {
  const [elements, setElements] = useState([]);
  const [labelSize, setLabelSize] = useState({ width: 50, height: 30 });

  return (
    <LabelEditor
      sampleData={sampleData}
      availableSamples={samples}
      initialElements={elements}
      labelSize={labelSize}
      onSave={(elements, size) => {
        setElements(elements);
        setLabelSize(size);
      }}
    />
  );
}
```

### Advanced Usage

```tsx
import { 
  LabelEditor, 
  useCanvasStore, 
  usePrint, 
  useExport 
} from '@/features/label-editor';

function AdvancedLabelEditor() {
  const {
    elements,
    selectedElements,
    addElement,
    updateElement,
    deleteElement
  } = useCanvasStore();

  const { printLabel, printTestPaper } = usePrint({
    elements,
    labelSize: { width: 50, height: 30 },
    sampleData
  });

  const { exportPNG, exportSVG, exportPDF } = useExport({
    elements,
    labelSize: { width: 50, height: 30 },
    sampleData
  });

  // Your component logic...
}
```

## Components

### Core Components
- **LabelEditor**: Main editor component
- **Canvas**: Fabric.js canvas with rulers and guides
- **ToolsPanel**: Element creation and manipulation tools
- **InspectorPanel**: Property editing for selected elements
- **LayersPanel**: Layer management and ordering
- **DataBinding**: Sample data integration and variable management

### Hooks
- **useCanvasStore**: Zustand store for canvas state management
- **usePrint**: Print functionality with exact scale
- **useExport**: Export to PNG, SVG, and PDF

### Utilities
- **unitConversion**: Millimeter to pixel conversion utilities
- **fabricUtils**: Fabric.js helper functions

## Data Types

### LabelElement
```typescript
interface LabelElement {
  id: string;
  type: 'text' | 'image' | 'qr' | 'barcode' | 'shape' | 'line' | 'table' | 'variable';
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  rotation: number; // in degrees
  content: string;
  style: ElementStyle;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}
```

### SampleData
```typescript
interface SampleData {
  id: string;
  ArabicName: string;
  EnglishName: string;
  SupplierCode: string;
  Price25: number;
  Price50: number;
  Price100: number;
  QRValue: string;
  BarcodeValue: string;
  ExtraFields: Record<string, any>;
}
```

## Keyboard Shortcuts

- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Ctrl+S**: Save
- **Ctrl+C**: Copy selected elements
- **Ctrl+V**: Paste elements
- **Delete/Backspace**: Delete selected elements
- **Escape**: Clear selection

## Styling

The Label Editor uses Tailwind CSS for styling and is fully responsive. All components follow the existing design system and can be customized through CSS variables.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- React 18+
- TypeScript 4.5+
- Fabric.js 5.0+
- Zustand 4.0+
- PDF-lib 2.0+
- JSBarcode 3.11+

## Performance

- Canvas rendering is optimized for smooth interaction
- History management is limited to 50 states to prevent memory issues
- Export functions use Web Workers for large operations
- Lazy loading for large sample datasets

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Focus management for modal dialogs

## Future Enhancements

- [ ] Advanced text formatting (bold, italic, underline)
- [ ] Image cropping and filters
- [ ] Custom shape creation
- [ ] Animation support
- [ ] Collaborative editing
- [ ] Version control for templates
- [ ] Batch processing
- [ ] API integration for external data sources
