import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Minus, 
  Search, 
  Star, 
  Snowflake, 
  Sun, 
  Leaf, 
  Flower,
  Droplets,
  Flame,
  TreePine,
  Heart,
  Coffee,
  Moon,
  Sparkles,
  Target,
  TrendingUp,
  Beaker
} from 'lucide-react';
import { toast } from 'sonner';
import { customDataService } from '@/services/customDataService';
import { getFieldOptions } from '@/lib/customFieldsUtils';
import { SampleLedgerData } from '@/lib/types';
import { PrioritySelector, PriorityValue } from '@/components/PrioritySelector';

// Global perfume brands
const globalPerfumeBrands = [
  'Chanel', 'Dior', 'Tom Ford', 'Yves Saint Laurent', 'Versace', 'Gucci', 'Prada', 'Armani',
  'Hermès', 'Bulgari', 'Cartier', 'Dolce & Gabbana', 'Calvin Klein', 'Hugo Boss', 'Burberry',
  'Marc Jacobs', 'Givenchy', 'Lancome', 'Estée Lauder', 'Clinique', 'Kenzo', 'Issey Miyake',
  'Jean Paul Gaultier', 'Thierry Mugler', 'Maison Francis Kurkdjian', 'Creed', 'Amouage',
  'Montale', 'Mancera', 'Nasomatto', 'Byredo', 'Le Labo', 'Diptyque', 'Maison Margiela',
  'Acqua di Parma', 'Penhaligon\'s', 'L\'Artisan Parfumeur', 'Annick Goutal', 'Serge Lutens'
];


const conceptOptions = [
  'Matching', 'Best Seller', 'New Launch', 'Limited Edition', 'Premium', 'Classic', 
  'Trending', 'Seasonal', 'Exclusive', 'Custom Blend'
];


interface SampleLedgerAdvancedProps {
  sample: any;
  onSave: (ledgerData: SampleLedgerData) => void;
  onCancel: () => void;
}

export const SampleLedgerAdvanced: React.FC<SampleLedgerAdvancedProps> = ({
  sample,
  onSave,
  onCancel
}) => {
  const [ledgerData, setLedgerData] = useState<SampleLedgerData>({
    mainBrand: sample?.ledger?.mainBrand || '',
    customMainBrand: sample?.ledger?.customMainBrand || '',
    relatedNames: sample?.ledger?.relatedNames || [''],
    sampleResult: sample?.ledger?.sampleResult || 'Pending',
    customerSampleNo: sample?.ledger?.customerSampleNo || '',
    dpgPercentage: sample?.ledger?.dpgPercentage || 0,
    previousDpgSampleId: sample?.ledger?.previousDpgSampleId || '',
    previousDpgPercentage: sample?.ledger?.previousDpgPercentage || 0,
    priorityLevel: sample?.ledger?.priorityLevel || 'Medium',
    concept: sample?.ledger?.concept || sample?.purpose || '',
    customConcept: sample?.ledger?.customConcept || '',
    ingredients: sample?.ledger?.ingredients || {
      topNotes: [''],
      middleNotes: [''],
      baseNotes: ['']
    },
  });

  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomConcept, setShowCustomConcept] = useState(false);
  const [allPerfumeBrands, setAllPerfumeBrands] = useState<string[]>([]);
  const [availableSamples, setAvailableSamples] = useState<any[]>([]);
  const [allConcepts, setAllConcepts] = useState<string[]>([]);

  // Load custom data on component mount
  useEffect(() => {
    const customBrands = customDataService.getCustomPerfumeBrands();
    const customConcepts = customDataService.getCustomConcepts();
    setAllPerfumeBrands([...globalPerfumeBrands, ...customBrands]);
    setAllConcepts([...conceptOptions, ...customConcepts]);

    // Load available samples
    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
    if (storedSamples) {
      const samples = JSON.parse(storedSamples);
      // Exclude the current sample from the list
      const filteredSamples = samples.filter((s: any) => s.id !== sample?.id);
      setAvailableSamples(filteredSamples);
    }
  }, [sample?.id]);

  const addRelatedName = () => {
    setLedgerData(prev => ({
      ...prev,
      relatedNames: [...prev.relatedNames, '']
    }));
  };

  const removeRelatedName = (index: number) => {
    setLedgerData(prev => ({
      ...prev,
      relatedNames: prev.relatedNames.filter((_, i) => i !== index)
    }));
  };

  const updateRelatedName = (index: number, value: string) => {
    setLedgerData(prev => ({
      ...prev,
      relatedNames: prev.relatedNames.map((name, i) => i === index ? value : name)
    }));
  };

  const addIngredient = (noteType: 'topNotes' | 'middleNotes' | 'baseNotes') => {
    setLedgerData(prev => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [noteType]: [...prev.ingredients[noteType], '']
      }
    }));
  };

  const removeIngredient = (noteType: 'topNotes' | 'middleNotes' | 'baseNotes', index: number) => {
    setLedgerData(prev => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [noteType]: prev.ingredients[noteType].filter((_, i) => i !== index)
      }
    }));
  };

  const updateIngredient = (noteType: 'topNotes' | 'middleNotes' | 'baseNotes', index: number, value: string) => {
    setLedgerData(prev => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [noteType]: prev.ingredients[noteType].map((ingredient, i) => i === index ? value : ingredient)
      }
    }));
  };



  const handleSubmit = () => {
    // Validate required fields
    if (!ledgerData.mainBrand) {
      toast.error('Please fill in Main Brand');
      return;
    }

    // Save custom data to database for future use
    if (showCustomBrand && ledgerData.customMainBrand) {
      const added = customDataService.addCustomPerfumeBrand(ledgerData.customMainBrand);
      if (added) {
        toast.success(`Added "${ledgerData.customMainBrand}" to perfume brands`);
        // Update local state
        setAllPerfumeBrands(prev => [...prev, ledgerData.customMainBrand!].sort());
      }
    }

    if (showCustomConcept && ledgerData.customConcept) {
      const added = customDataService.addCustomConcept(ledgerData.customConcept);
      if (added) {
        toast.success(`Added "${ledgerData.customConcept}" to concepts`);
        setAllConcepts(prev => [...prev, ledgerData.customConcept!].sort());
      }
    }


    onSave(ledgerData);
    toast.success('Sample ledger saved successfully');
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sample Ledger</h2>
          <p className="text-gray-600">Comprehensive sample information and fragrance details</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>
            <Target className="h-4 w-4 mr-2" />
            Save Ledger
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mainBrand">Main Brand *</Label>
              <div className="flex gap-2">
                <Select
                  value={showCustomBrand ? 'custom' : ledgerData.mainBrand}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomBrand(true);
                    } else {
                      setShowCustomBrand(false);
                      setLedgerData(prev => ({ ...prev, mainBrand: value }));
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select main brand" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {getFieldOptions('main-brand').map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ Define New Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showCustomBrand && (
                <Input
                  value={ledgerData.customMainBrand || ''}
                  onChange={(e) => setLedgerData(prev => ({ ...prev, customMainBrand: e.target.value }))}
                  placeholder="Enter custom brand name"
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label>Related Names</Label>
              {ledgerData.relatedNames.map((name, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={name}
                    onChange={(e) => updateRelatedName(index, e.target.value)}
                    placeholder={`Related name ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRelatedName(index)}
                    disabled={ledgerData.relatedNames.length <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addRelatedName}
                className="mt-2 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Related Name
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerSampleNo">Customer Sample No.</Label>
                <Input
                  id="customerSampleNo"
                  value={ledgerData.customerSampleNo}
                  onChange={(e) => setLedgerData(prev => ({ ...prev, customerSampleNo: e.target.value }))}
                  placeholder="Enter customer sample number"
                />
              </div>
              <div>
                <Label htmlFor="sampleResult">Sample Result</Label>
                <Select
                  value={ledgerData.sampleResult}
                  onValueChange={(value: any) => setLedgerData(prev => ({ ...prev, sampleResult: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions('sample-status').map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority & Concept */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Priority & Concept
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="priorityLevel">Priority Level</Label>
              <PrioritySelector
                value={ledgerData.priorityLevel.toLowerCase() as PriorityValue}
                onChange={(value) => setLedgerData(prev => ({ 
                  ...prev, 
                  priorityLevel: value.charAt(0).toUpperCase() + value.slice(1) as 'Low' | 'Medium' | 'High' | 'Critical'
                }))}
                placeholder="Select priority level"
              />
            </div>

            <div>
              <Label htmlFor="concept">Concept</Label>
              <div className="flex gap-2">
                <Select
                  value={showCustomConcept ? 'custom' : ledgerData.concept}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomConcept(true);
                    } else {
                      setShowCustomConcept(false);
                      setLedgerData(prev => ({ ...prev, concept: value }));
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select concept" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFieldOptions('ledger-concept').map((concept) => (
                      <SelectItem key={concept.value} value={concept.value}>
                        {concept.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ Define New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showCustomConcept && (
                <Input
                  value={ledgerData.customConcept || ''}
                  onChange={(e) => setLedgerData(prev => ({ ...prev, customConcept: e.target.value }))}
                  placeholder="Enter custom concept"
                  className="mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dpgPercentage">Current DPG</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="dpgPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={ledgerData.dpgPercentage}
                    onChange={(e) => setLedgerData(prev => ({ ...prev, dpgPercentage: parseFloat(e.target.value) || 0 }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="previousDpgPercentage">Previous DPG</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="previousDpgPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={ledgerData.previousDpgPercentage || 0}
                    readOnly
                    className="flex-1 bg-gray-50"
                    placeholder="Select a sample below"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {ledgerData.previousDpgSampleId && ledgerData.previousDpgSampleId !== 'none' && (
                  <p className="text-xs text-gray-600 mt-1">
                    From: {availableSamples.find(s => s.id === ledgerData.previousDpgSampleId)?.itemNameEN || 'Unknown'}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="previousSample">Previous Sample</Label>
                <Select 
                  value={ledgerData.previousDpgSampleId || 'none'} 
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setLedgerData(prev => ({ 
                        ...prev, 
                        previousDpgSampleId: '',
                        previousDpgPercentage: 0
                      }));
                    } else {
                      // Find the selected sample and get its DPG percentage
                      const selectedSample = availableSamples.find(s => s.id === value);
                      const dpgPercent = selectedSample?.ledger?.dpgPercentage || 0;
                      setLedgerData(prev => ({ 
                        ...prev, 
                        previousDpgSampleId: value,
                        previousDpgPercentage: dpgPercent
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sample" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableSamples.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.itemNameEN} (#{s.sampleNo}) - DPG: {s.ledger?.dpgPercentage || 0}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Fragrance Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['topNotes', 'middleNotes', 'baseNotes'] as const).map((noteType) => (
              <div key={noteType}>
                <Label className="capitalize">
                  {noteType === 'topNotes' ? 'Top Notes' : 
                   noteType === 'middleNotes' ? 'Middle Notes' : 'Base Notes'}
                </Label>
                {ledgerData.ingredients[noteType].map((ingredient, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={ingredient}
                      onChange={(e) => updateIngredient(noteType, index, e.target.value)}
                      placeholder={`${noteType === 'topNotes' ? 'Top' : noteType === 'middleNotes' ? 'Middle' : 'Base'} note ingredient`}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredient(noteType, index)}
                      disabled={ledgerData.ingredients[noteType].length <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addIngredient(noteType)}
                  className="mt-2 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {noteType === 'topNotes' ? 'Top' : noteType === 'middleNotes' ? 'Middle' : 'Base'} Note
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
