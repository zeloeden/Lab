/**
 * Print preview and batch printing system
 */

import React, { useState, useEffect, useRef } from 'react';
import { EnhancedLabelTemplate } from '@/lib/label-model';
import { renderTemplateToPDF } from '@/lib/render/pdfRenderer';
import { renderTemplateToPNG } from '@/lib/render/pngRenderer';
import { substituteVariables, createSampleContext } from '@/lib/variableParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Download, 
  Eye, 
  Settings, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface PrintJob {
  id: string;
  template: EnhancedLabelTemplate;
  data: Record<string, any>;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface PrintSettings {
  copies: number;
  paperSize: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  margin: number;
  dpi: 203 | 300 | 600;
  colorMode: 'color' | 'grayscale' | 'monochrome';
  quality: 'draft' | 'normal' | 'high';
  collate: boolean;
  duplex: 'none' | 'long-edge' | 'short-edge';
}

interface PrintPreviewProps {
  template: EnhancedLabelTemplate;
  onClose: () => void;
  sampleData?: Record<string, any>[];
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  template,
  onClose,
  sampleData = []
}) => {
  const [previewMode, setPreviewMode] = useState<'preview' | 'print'>('preview');
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    copies: 1,
    paperSize: 'A4',
    orientation: 'portrait',
    margin: 10,
    dpi: 300,
    colorMode: 'color',
    quality: 'normal',
    collate: true,
    duplex: 'none'
  });
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [selectedDataIndex, setSelectedDataIndex] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate preview data
  useEffect(() => {
    if (sampleData.length > 0) {
      setPreviewData(sampleData);
    } else {
      // Generate sample data for preview
      const sampleContext = createSampleContext();
      setPreviewData([sampleContext]);
    }
  }, [sampleData]);

  const handlePrint = async () => {
    if (previewMode === 'preview') {
      setPreviewMode('print');
      return;
    }

    setIsPrinting(true);
    
    // Create print jobs for each data row
    const jobs: PrintJob[] = previewData.map((data, index) => ({
      id: `job_${Date.now()}_${index}`,
      template,
      data,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    }));

    setPrintJobs(jobs);

    // Process print jobs
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        // Update job status
        setPrintJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: 'printing', startedAt: new Date() } : j
        ));

        // Generate PDF for each copy
        for (let copy = 0; copy < printSettings.copies; copy++) {
          const pdfData = await renderTemplateToPDF(template, data);
          
          // In a real implementation, you would send this to a printer
          // For now, we'll just simulate the printing process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update progress
          const progress = ((copy + 1) / printSettings.copies) * 100;
          setPrintJobs(prev => prev.map(j => 
            j.id === job.id ? { ...j, progress } : j
          ));
        }

        // Mark job as completed
        setPrintJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: 'completed', progress: 100, completedAt: new Date() } : j
        ));

      } catch (error) {
        // Mark job as failed
        setPrintJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          } : j
        ));
      }
    }

    setIsPrinting(false);
  };

  const handleCancelPrint = () => {
    setPrintJobs(prev => prev.map(job => 
      job.status === 'pending' || job.status === 'printing' 
        ? { ...job, status: 'cancelled' }
        : job
    ));
    setIsPrinting(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const data = previewData[selectedDataIndex];
      const pdfData = await renderTemplateToPDF(template, data);
      
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}_${selectedDataIndex + 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
    }
  };

  const handleDownloadPNG = async () => {
    try {
      const data = previewData[selectedDataIndex];
      const pngData = await renderTemplateToPNG(template, data);
      
      const a = document.createElement('a');
      a.href = pngData;
      a.download = `${template.name}_${selectedDataIndex + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('PNG download failed:', error);
    }
  };

  const getStatusIcon = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'printing': return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'printing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Preview
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              variant={previewMode === 'print' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('print')}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              disabled={zoom <= 0.25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              disabled={zoom >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPNG}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              PNG
            </Button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {isPrinting ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPrint}
              >
                <Square className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={previewData.length === 0}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="flex flex-col items-center gap-4">
              {/* Data Selection */}
              {previewData.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Data Row:</Label>
                  <Select
                    value={selectedDataIndex.toString()}
                    onValueChange={(value) => setSelectedDataIndex(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {previewData.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Row {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Preview Canvas */}
              <div
                ref={previewRef}
                className="bg-white border border-gray-300 shadow-lg"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center'
                }}
              >
                {/* This would be replaced with actual label preview */}
                <div className="p-8 text-center text-gray-500">
                  <div className="text-2xl mb-2">📄</div>
                  <div>Label Preview</div>
                  <div className="text-sm mt-2">
                    {template.name} - Row {selectedDataIndex + 1}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Copies</Label>
                  <Input
                    type="number"
                    value={printSettings.copies}
                    onChange={(e) => setPrintSettings(prev => ({
                      ...prev,
                      copies: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    min="1"
                    max="100"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Paper Size</Label>
                  <Select
                    value={printSettings.paperSize}
                    onValueChange={(value) => setPrintSettings(prev => ({
                      ...prev,
                      paperSize: value as any
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Orientation</Label>
                  <Select
                    value={printSettings.orientation}
                    onValueChange={(value) => setPrintSettings(prev => ({
                      ...prev,
                      orientation: value as any
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">DPI</Label>
                  <Select
                    value={printSettings.dpi.toString()}
                    onValueChange={(value) => setPrintSettings(prev => ({
                      ...prev,
                      dpi: parseInt(value) as any
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="203">203 DPI</SelectItem>
                      <SelectItem value="300">300 DPI</SelectItem>
                      <SelectItem value="600">600 DPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Color Mode</Label>
                  <Select
                    value={printSettings.colorMode}
                    onValueChange={(value) => setPrintSettings(prev => ({
                      ...prev,
                      colorMode: value as any
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="grayscale">Grayscale</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Quality</Label>
                  <Select
                    value={printSettings.quality}
                    onValueChange={(value) => setPrintSettings(prev => ({
                      ...prev,
                      quality: value as any
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="jobs" className="mt-4">
                <div className="space-y-2">
                  {printJobs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No print jobs yet
                    </div>
                  ) : (
                    printJobs.map(job => (
                      <div key={job.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <span className="text-sm font-medium">Job {job.id.split('_')[2]}</span>
                          </div>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                        
                        {job.status === 'printing' && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        )}
                        
                        {job.error && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {job.error}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Created: {job.createdAt.toLocaleTimeString()}
                          {job.completedAt && (
                            <span> • Completed: {job.completedAt.toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
