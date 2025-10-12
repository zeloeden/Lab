# Professional Label Editor System

A comprehensive, production-ready label template editor built with React, TypeScript, and Fabric.js.

## 🚀 Features

### Core Functionality
- **Visual Editor**: Drag-and-drop interface with Fabric.js canvas
- **Element Types**: Text, Images, Barcodes, QR Codes, Shapes, Tables
- **Unit Conversion**: Seamless mm ↔ px conversion at fixed DPI (300)
- **Guides & Grid**: Safe/bleed areas, grid snapping, alignment tools
- **Layers Panel**: Element hierarchy management with visibility/lock controls
- **Inspector Panel**: Comprehensive property editing for all elements
- **Assets Manager**: Upload and manage images, fonts, icons, templates
- **Batch Printing**: Dataset integration with field mapping

### Advanced Features
- **RTL Support**: Right-to-left text rendering
- **Variable Substitution**: `{{field}}` syntax for dynamic content
- **Style Management**: Named styles with inheritance
- **Version Control**: Template versioning and change tracking
- **Export Formats**: PDF (vector), PNG (raster), ZPL (thermal printers)
- **Real-time Preview**: Live canvas rendering with high DPI support
- **Responsive Design**: Works on desktop and tablet devices

## 📁 Architecture

### Core Modules
```
src/lib/
├── units.ts              # Unit conversion utilities
├── label-model.ts        # Enhanced data models
└── render/
    ├── pdfRenderer.ts    # PDF export with pdf-lib
    ├── pngRenderer.ts    # PNG export with Canvas API
    └── zplRenderer.ts    # ZPL export for thermal printers

src/components/label/
├── Editor.tsx            # Main editor with Fabric.js
├── Inspector.tsx         # Property editing panel
├── Layers.tsx            # Element hierarchy management
├── Assets.tsx            # Asset management
└── PrintDialog.tsx       # Batch printing interface
```

### Data Models

#### EnhancedLabelTemplate
```typescript
interface EnhancedLabelTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  size: { width: number; height: number; unit: Unit; dpi: Dpi };
  margins?: { safe?: number; bleed?: number; unit: Unit };
  elements: EnhancedLabelElement[];
  styles?: Record<string, TextStyle>;
  variables?: string[];
  repeaters?: RepeaterConfig[];
  version: number;
  isLocked?: boolean;
  isPublic?: boolean;
  // ... metadata fields
}
```

#### Element Types
- **TextElement**: Rich text with RTL, styling, variable substitution
- **ImageElement**: Images with fit modes, filters, cropping
- **BarcodeElement**: Multiple symbologies (Code128, EAN13, etc.)
- **QRElement**: QR codes with error correction, logos
- **ShapeElement**: Rectangles, circles, lines, polygons, paths
- **TableElement**: Dynamic tables with data binding

## 🛠️ Usage

### Basic Setup
```tsx
import { LabelEditor } from '@/components/label/Editor';
import { EnhancedLabelTemplate } from '@/lib/label-model';

const MyLabelEditor = () => {
  const [template, setTemplate] = useState<EnhancedLabelTemplate | null>(null);

  return (
    <LabelEditor
      template={template}
      onSave={(updatedTemplate) => {
        setTemplate(updatedTemplate);
        // Save to backend
      }}
      onClose={() => {
        // Handle close
      }}
    />
  );
};
```

### Unit Conversion
```typescript
import { toPx, fromPx, convertUnit } from '@/lib/units';

// Convert mm to pixels at 300 DPI
const pixels = toPx(100, 'mm'); // 1181.1px

// Convert pixels to mm
const mm = fromPx(1181.1, 'mm'); // 100mm

// Convert between units
const inches = convertUnit(100, 'mm', 'in'); // 3.937in
```

### Export Templates
```typescript
import { PDFRenderer, PNGRenderer, ZPLRenderer } from '@/lib/render';

// PDF Export
const pdfRenderer = new PDFRenderer({ dpi: 300, colorMode: 'color' });
const pdfResult = await pdfRenderer.renderTemplate(template, data);

// PNG Export
const pngRenderer = new PNGRenderer({ dpi: 300, quality: 1 });
const pngResult = await pngRenderer.renderTemplate(template, data);

// ZPL Export (Thermal Printers)
const zplRenderer = new ZPLRenderer({ dpi: 203, printDensity: 8 });
const zplResult = zplRenderer.renderTemplate(template, data);
```

## 🎨 Customization

### Adding New Element Types
1. Extend `EnhancedLabelElement` union type
2. Add element creation logic in `Editor.tsx`
3. Implement Fabric.js object creation
4. Add inspector panel for element properties

### Custom Renderers
1. Implement renderer interface
2. Add export format to main editor
3. Register with export system

### Styling
The system uses Tailwind CSS with custom glassmorphism components. Key classes:
- `.glass-panel`: Glassmorphism background
- `.glass-gradient-overlay`: Gradient overlays
- `.glass-watermark`: Watermark backgrounds

## 🔧 Configuration

### DPI Settings
- **203 DPI**: Standard thermal printer resolution
- **300 DPI**: High-quality printing (default)
- **600 DPI**: Ultra-high quality printing

### Unit Support
- **mm**: Millimeters (default)
- **px**: Pixels
- **in**: Inches

### Grid & Guides
- **Grid Size**: Configurable in mm (default: 1mm)
- **Safe Area**: Configurable margin for content
- **Bleed Area**: Configurable margin for printing

## 📱 Responsive Design

The editor adapts to different screen sizes:
- **Desktop**: Full 3-panel layout (tools, canvas, inspector)
- **Tablet**: Collapsible sidebars
- **Mobile**: Single-panel mode with tab navigation

## 🚀 Performance

### Optimization Features
- **Canvas Rendering**: Hardware-accelerated with Fabric.js
- **Lazy Loading**: Assets loaded on demand
- **Debounced Updates**: Prevents excessive re-renders
- **Memory Management**: Proper cleanup of canvas objects

### Best Practices
- Use `useCallback` for event handlers
- Implement `useMemo` for expensive calculations
- Clean up Fabric.js objects on unmount
- Optimize image assets before upload

## 🔒 Security

### Data Validation
- Template validation with schema checking
- File upload restrictions by type and size
- XSS prevention in text content
- Input sanitization for all user data

### Access Control
- Template-level permissions
- Asset access restrictions
- Print job authorization
- Audit logging for all operations

## 🧪 Testing

### Unit Tests
```bash
npm run test:label-editor
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📚 API Reference

### LabelEditor Props
```typescript
interface LabelEditorProps {
  template?: EnhancedLabelTemplate;
  onSave?: (template: EnhancedLabelTemplate) => void;
  onClose?: () => void;
}
```

### Renderer Options
```typescript
interface PDFRenderOptions {
  dpi?: Dpi;
  colorMode?: 'monochrome' | 'color';
  quality?: 'draft' | 'normal' | 'high';
  embedFonts?: boolean;
  subsetFonts?: boolean;
  compress?: boolean;
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the documentation
- Search existing issues
- Create a new issue with detailed description
- Contact the development team

---

**Built with ❤️ using React, TypeScript, Fabric.js, and modern web technologies.**
