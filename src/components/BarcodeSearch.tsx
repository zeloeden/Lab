import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, QrCode } from 'lucide-react';
import { Sample } from '@/lib/types';
import { sampleService } from '@/services/sampleService';

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Barcode/QR Code Search
        </CardTitle>
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
