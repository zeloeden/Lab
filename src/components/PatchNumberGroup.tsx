import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Package, Eye, Download } from 'lucide-react';
import { sampleService } from '@/services/sampleService';
import { Sample } from '@/lib/types';
import GlassSectionHeader from '@/components/ui/GlassSectionHeader';

interface PatchNumberGroupProps {
  patchNumber: string;
  currentSampleId?: string; // ID of the current sample viewing this patch
  onSampleSelect?: (sample: Sample) => void;
}

export const PatchNumberGroup: React.FC<PatchNumberGroupProps> = ({
  patchNumber,
  currentSampleId,
  onSampleSelect
}) => {
  const { colors } = useTheme();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSamples();
  }, [patchNumber]);

  const loadSamples = async () => {
    if (!patchNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const patchSamples = await sampleService.getSamplesByPatchNumber(patchNumber);
      setSamples(patchSamples);
    } catch (err) {
      setError('Failed to load samples for this patch number');
      console.error('Error loading patch samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Sample['status']) => {
    switch (status) {
      case 'Untested':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Testing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPurposeColor = (purpose: Sample['purpose']) => {
    return purpose === 'Personal Use' 
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  if (loading) {
    return (
      <Card className="hover:shadow-md transition-shadow data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <CardHeader className="p-0">
          <GlassSectionHeader
            icon={<Package className="h-5 w-5" />}
            title={`Patch Number: ${patchNumber}`}
            subtitle="Loading..."
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover:shadow-md transition-shadow data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <CardHeader className="p-0">
          <GlassSectionHeader
            icon={<Package className="h-5 w-5" />}
            title={`Patch Number: ${patchNumber}`}
            subtitle="Error"
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadSamples} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hide the patch group if there's only one sample and it's the current sample
  if (samples.length === 1 && currentSampleId && samples[0].id === currentSampleId) {
    return null;
  }

  return (
    <Card className="hover:shadow-md transition-shadow data-[state=open]:animate-in data-[state=open]:fade-in-0">
      <CardHeader className="p-0">
        <GlassSectionHeader
          icon={<Package className="h-5 w-5" />}
          title={`Patch Number: ${patchNumber}`}
          subtitle={`${samples.length} samples`}
        />
      </CardHeader>
      <CardContent>
        {samples.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No samples found for this patch number
          </div>
        ) : (
          <div className="space-y-4">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="relative glass-panel glass-gradient-overlay ring-1 ring-white/10 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  if (onSampleSelect) return onSampleSelect(sample);
                  // Fallback: open default sample detail route if available
                  localStorage.setItem('nbslims_open_sample_id', sample.id);
                  window.dispatchEvent(new CustomEvent('sampleSelected', { detail: sample }));
                }}
              >
                {/* Watermark removed */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        Sample #{sample.sampleNo}
                      </h3>
                      <Badge className={getStatusColor(sample.status)}>
                        {sample.status}
                      </Badge>
                      {(sample as any).purpose && (
                        <Badge className={getPurposeColor((sample as any).purpose)}>
                          {(sample as any).purpose
                        }</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Item (EN):</span> {sample.itemNameEN}
                      </div>
                      <div>
                        <span className="font-medium">Item (AR):</span> {sample.itemNameAR}
                      </div>
                      <div>
                        <span className="font-medium">Batch:</span> {sample.patchNumber || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Supplier Code:</span> {sample.supplierCode || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Barcode:</span> {sample.barcode || 'Not generated'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(sample.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSampleSelect) return onSampleSelect(sample);
                        localStorage.setItem('nbslims_open_sample_id', sample.id);
                        window.dispatchEvent(new CustomEvent('sampleSelected', { detail: sample }));
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface BarcodeSearchProps {
  onSampleFound?: (sample: Sample) => void;
}

export const BarcodeSearch: React.FC<BarcodeSearchProps> = ({ onSampleFound }) => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundSample, setFoundSample] = useState<Sample | null>(null);

  const handleSearch = async () => {
    if (!barcode.trim()) return;
    
    setLoading(true);
    setError(null);
    setFoundSample(null);
    
    try {
      const sample = await sampleService.searchSampleByBarcode(barcode);
      if (sample) {
        setFoundSample(sample);
        onSampleFound?.(sample);
      } else {
        setError('No sample found with this barcode');
      }
    } catch (err) {
      setError('Failed to search for sample');
      console.error('Error searching by barcode:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow data-[state=open]:animate-in data-[state=open]:fade-in-0">
      <CardHeader className="p-0">
        <GlassSectionHeader
          icon={<Search className="h-5 w-5" />}
          title="Barcode/QR Code Search"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="barcode-input">Enter Barcode or QR Code</Label>
            <Input
              id="barcode-input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scan or enter barcode..."
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleSearch} 
              disabled={loading || !barcode.trim()}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {foundSample && (
          <div className="border rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-lg mb-2 text-green-800">
              Sample Found: #{foundSample.sampleNo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Item (EN):</span> {foundSample.itemNameEN}
              </div>
              <div>
                <span className="font-medium">Item (AR):</span> {foundSample.itemNameAR}
              </div>
              <div>
                <span className="font-medium">Status:</span> {foundSample.status}
              </div>
              <div>
                <span className="font-medium">Purpose:</span> {foundSample.purpose}
              </div>
              <div>
                <span className="font-medium">Patch Number:</span> {foundSample.patchNumber || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Supplier Code:</span> {foundSample.supplierCode || 'N/A'}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => onSampleFound?.(foundSample)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBarcode('');
                  setFoundSample(null);
                  setError(null);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
