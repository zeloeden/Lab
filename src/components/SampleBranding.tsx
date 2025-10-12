import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getSamples } from '@/services/sampleApi';
import { SampleBrandingHeader } from '@/components/SampleBrandingHeader';
import { SampleBrandingTable } from '@/components/SampleBrandingTable';
import { BrandDrawer } from '@/components/BrandDrawer';
import { SampleBrandingCards } from '@/components/SampleBrandingCards';
import { Grouping } from '@/components/Grouping';
import { 
  Tag,
  DollarSign,
  Package,
  Search,
  Edit,
  Save,
  X,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Sample } from '@/lib/types';
import { getFieldOptions } from '@/lib/customFieldsUtils';

interface SampleBrandingProps {
  samples: Sample[];
  onUpdate: () => void;
}

export const SampleBranding: React.FC<SampleBrandingProps> = ({ samples, onUpdate }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState('updatedAt:desc');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [status, setStatus] = useState('');
  const [isBrandDrawerOpen, setIsBrandDrawerOpen] = useState(false);
  const [drawerSampleId, setDrawerSampleId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'brand' | 'name-token'>('none');
  const [brandingForm, setBrandingForm] = useState({
    brand: '',
    price: 0,
    suggestedPrice: 0,
    currency: 'USD',
    notes: ''
  });

  // Local storage key for remembering last-used branding values
  const LAST_BRANDING_KEY = 'nbslims_last_branding';

  // Filter samples that are approved or accepted
  const brandableSamples = samples.filter(s => 
    (s.status === 'Accepted' || s.approved) && !s.isRawMaterial
  );

  // Server-like pagination/search via local adapter
  const { data, isLoading } = useQuery<{ data: any[]; page: number; pageSize: number; total: number }>({
    queryKey: ['branding-samples', { q: searchTerm, page, pageSize, sort, status }],
    queryFn: () => getSamples({ q: searchTerm, page, pageSize, sort, status }),
    placeholderData: (prev) => prev,
  });

  const prefillBrandingForm = (sample: Sample) => {
    try {
      const lastBrandingRaw = localStorage.getItem(LAST_BRANDING_KEY);
      const lastBranding = lastBrandingRaw ? JSON.parse(lastBrandingRaw) : null;

      setBrandingForm({
        brand: sample.brandedAs?.brand || lastBranding?.brand || '',
        price: sample.brandedAs?.price || lastBranding?.price || 0,
        suggestedPrice: sample.brandedAs?.suggestedPrice || lastBranding?.suggestedPrice || 0,
        currency: sample.brandedAs?.currency || lastBranding?.currency || 'USD',
        notes: sample.brandedAs?.notes || lastBranding?.notes || ''
      });
    } catch {
      setBrandingForm({
        brand: sample.brandedAs?.brand || '',
        price: sample.brandedAs?.price || 0,
        suggestedPrice: sample.brandedAs?.suggestedPrice || 0,
        currency: sample.brandedAs?.currency || 'USD',
        notes: sample.brandedAs?.notes || ''
      });
    }
  };

  const handleBrandSample = (sample: Sample) => {
    setSelectedSample(sample);
    prefillBrandingForm(sample);

    setIsDialogOpen(true);
  };

  const handleSaveBranding = () => {
    if (!selectedSample) return;

    if (!brandingForm.brand) {
      toast.error('Please select a brand');
      return;
    }

    // Update the sample with branding information
    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
    if (storedSamples) {
      const allSamples = JSON.parse(storedSamples);
      const updatedSamples = allSamples.map((s: Sample) => {
        if (s.id === selectedSample.id) {
          return {
            ...s,
            brandedAs: {
              ...brandingForm,
              brandedBy: user?.id || 'unknown',
              brandedAt: new Date()
            }
          };
        }
        return s;
      });

      localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
      // Remember last-used branding values for the next sample
      try {
        localStorage.setItem(LAST_BRANDING_KEY, JSON.stringify(brandingForm));
      } catch {}
      
      // Trigger update event
      window.dispatchEvent(new CustomEvent('sampleUpdated', { 
        detail: { sampleId: selectedSample.id, field: 'brandedAs', value: brandingForm }
      }));

      toast.success('Sample branding saved successfully');
      setIsDialogOpen(false);
      setSelectedSample(null);
      onUpdate();
    }
  };

  const handleRemoveBranding = (sampleId: string) => {
    if (!confirm('Are you sure you want to remove branding from this sample?')) return;

    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
    if (storedSamples) {
      const allSamples = JSON.parse(storedSamples);
      const updatedSamples = allSamples.map((s: Sample) => {
        if (s.id === sampleId) {
          const { brandedAs, ...rest } = s;
          return rest;
        }
        return s;
      });

      localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
      
      window.dispatchEvent(new CustomEvent('sampleUpdated', { 
        detail: { sampleId, field: 'brandedAs', value: null }
      }));

      toast.success('Branding removed');
      onUpdate();
    }
  };

  const calculateMarkup = () => {
    if (brandingForm.price > 0 && brandingForm.suggestedPrice > 0) {
      const markup = ((brandingForm.suggestedPrice - brandingForm.price) / brandingForm.price) * 100;
      return markup.toFixed(1);
    }
    return '0';
  };

  return (
    <>
      <SampleBrandingHeader
        q={searchTerm}
        onQChange={setSearchTerm}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        total={data?.total}
      />

      <Grouping
        rows={(data?.data || []) as any}
        by={groupBy}
        render={(rows) => (
          view === 'table' ? (
            <SampleBrandingTable
              rows={rows as any}
              isLoading={isLoading}
              virtualize={pageSize >= 100}
              onBrand={(id) => {
                console.log('Brand clicked for ID:', id);
                const s = brandableSamples.find(b => b.id === id);
                if (s) {
                  console.log('Found sample:', s);
                  setDrawerSampleId(id);
                  setIsBrandDrawerOpen(true);
                } else {
                  console.log('Sample not found in brandableSamples, trying all samples');
                  const fallbackSample = samples.find(s => s.id === id);
                  if (fallbackSample) {
                    console.log('Found in all samples:', fallbackSample);
                    setDrawerSampleId(id);
                    setIsBrandDrawerOpen(true);
                  }
                }
              }}
            />
          ) : (
            <SampleBrandingCards
              rows={rows as any}
              onBrand={(id) => {
                console.log('Brand clicked for ID (cards):', id);
                const s = brandableSamples.find(b => b.id === id);
                if (s) {
                  console.log('Found sample (cards):', s);
                  setDrawerSampleId(id);
                  setIsBrandDrawerOpen(true);
                } else {
                  console.log('Sample not found in brandableSamples (cards), trying all samples');
                  const fallbackSample = samples.find(s => s.id === id);
                  if (fallbackSample) {
                    console.log('Found in all samples (cards):', fallbackSample);
                    setDrawerSampleId(id);
                    setIsBrandDrawerOpen(true);
                  }
                }
              }}
            />
          )
        )}
      />

      <BrandDrawer
        open={isBrandDrawerOpen}
        onOpenChange={setIsBrandDrawerOpen}
        sampleId={drawerSampleId}
        initial={drawerSampleId ? brandableSamples.find(s => s.id === drawerSampleId)?.brandedAs : undefined}
        onSuccess={() => {
          onUpdate();
        }}
      />

      {/* Branding Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brand Sample</DialogTitle>
            <DialogDescription>
              Select a sample and assign branding details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sample">Sample *</Label>
              <Select
                value={selectedSample?.id || ''}
                onValueChange={(value) => {
                  const s = brandableSamples.find(bs => bs.id === value);
                  if (s) {
                    setSelectedSample(s);
                    prefillBrandingForm(s);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sample" />
                </SelectTrigger>
                <SelectContent>
                  {brandableSamples.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      #{s.sampleNo} — {s.itemNameEN}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">Brand Name *</Label>
              <Select
                value={brandingForm.brand}
                onValueChange={(value) => setBrandingForm({ ...brandingForm, brand: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions('branded-as').map(brand => (
                    <SelectItem key={brand.value} value={brand.value}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={brandingForm.price}
                  onChange={(e) => setBrandingForm({ ...brandingForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="suggestedPrice">Suggested Price</Label>
                <Input
                  id="suggestedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={brandingForm.suggestedPrice}
                  onChange={(e) => setBrandingForm({ ...brandingForm, suggestedPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {brandingForm.price > 0 && brandingForm.suggestedPrice > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Markup Percentage:</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-600">{calculateMarkup()}%</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={brandingForm.currency}
                onValueChange={(value) => setBrandingForm({ ...brandingForm, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="IQD">IQD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={brandingForm.notes}
                onChange={(e) => setBrandingForm({ ...brandingForm, notes: e.target.value })}
                placeholder="Additional notes about the branding..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={!selectedSample}>
              <Save className="h-4 w-4 mr-2" />
              Save Branding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
