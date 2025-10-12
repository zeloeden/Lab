import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  AlertTriangle, 
  Clock, 
  Star, 
  TrendingUp,
  ArrowRight,
  Target,
  RefreshCw,
  Eye
} from 'lucide-react';
import { PrioritySelector, PriorityValue } from '@/components/PrioritySelector';
import { TestFormulaDialog } from '@/components/TestFormulaDialog';

interface SampleSuggestion {
  id: string;
  sampleNo: number;
  sampleId?: string;
  itemNameEN: string;
  itemNameAR?: string;
  status: 'Untested' | 'Retest';
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: Date;
  lastTestDate?: Date;
  supplier?: string;
  concept?: string;
  daysWaiting: number;
  hasTest?: boolean;
  testCount?: number;
}

interface TestingSuggestionsProps {
  className?: string;
}

export const TestingSuggestions: React.FC<TestingSuggestionsProps> = ({ className }) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SampleSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleSuggestion | null>(null);

  useEffect(() => {
    loadTestingSuggestions();
    
    // Listen for all data updates
    const handleSampleUpdate = () => {
      loadTestingSuggestions();
    };
    
    const handleTestUpdate = () => {
      loadTestingSuggestions();
    };
    
    window.addEventListener('sampleUpdated', handleSampleUpdate);
    window.addEventListener('sampleCreated', handleSampleUpdate);
    window.addEventListener('testUpdated', handleTestUpdate);
    window.addEventListener('testCreated', handleTestUpdate);
    
    return () => {
      window.removeEventListener('sampleUpdated', handleSampleUpdate);
      window.removeEventListener('sampleCreated', handleSampleUpdate);
      window.removeEventListener('testUpdated', handleTestUpdate);
      window.removeEventListener('testCreated', handleTestUpdate);
    };
  }, []);

  const loadTestingSuggestions = async () => {
    try {
      setLoading(true);
      
      // Load samples from localStorage
      const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
      const storedTests = localStorage.getItem('nbslims_tests');
      const allTests = storedTests ? JSON.parse(storedTests) : [];
      
      if (storedSamples) {
        const samples = JSON.parse(storedSamples);
        
        // Filter untested and retest samples
        const untestedSamples = samples.filter((sample: any) => 
          sample.status === 'Untested' || sample.status === 'Retest'
        );

        // Transform to suggestions with priority scoring
        const samplesWithPriority = untestedSamples.map((sample: any) => {
          const createdDate = new Date(sample.createdAt || Date.now());
          const daysWaiting = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check if test exists for this sample
          const existingTests = allTests.filter((test: any) => test.sampleId === sample.id);
          const hasTest = existingTests.length > 0;
          
          return {
            id: sample.id,
            sampleNo: sample.sampleNo,
            sampleId: sample.sampleId || sample.customIdNo,
            itemNameEN: sample.itemNameEN,
            itemNameAR: sample.itemNameAR,
            status: sample.status,
            priorityLevel: sample.ledger?.priorityLevel || 'Medium',
            createdAt: createdDate,
            lastTestDate: sample.lastTestDate ? new Date(sample.lastTestDate) : undefined,
            supplier: sample.supplierId,
            concept: sample.ledger?.concept || sample.purpose,
            daysWaiting,
            hasTest,
            testCount: existingTests.length
          };
        });

        // Sort by priority and waiting time
        const sortedSuggestions = samplesWithPriority.sort((a, b) => {
          // Priority order: Critical > High > Medium > Low
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          const aPriority = priorityOrder[a.priorityLevel];
          const bPriority = priorityOrder[b.priorityLevel];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          // If same priority, sort by waiting time (longer waiting first)
          return b.daysWaiting - a.daysWaiting;
        });

        setSuggestions(sortedSuggestions.slice(0, 10)); // Show top 10 suggestions
      }
    } catch (error) {
      console.error('Error loading testing suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Untested': return 'bg-blue-100 text-blue-800';
      case 'Retest': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTestSample = async (sampleId: string) => {
    try {
      // Check if tests exist for this sample
      const storedTests = localStorage.getItem('nbslims_tests');
      const allTests = storedTests ? JSON.parse(storedTests) : [];
      
      // Find existing tests for this sample
      const existingTests = allTests.filter((test: any) => test.sampleId === sampleId);
      
      if (existingTests.length > 0) {
        // If test exists, navigate to test management page with the most recent test highlighted
        const mostRecentTest = existingTests.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        navigate(`/test-management?highlight=${mostRecentTest.id}`);
      } else {
        // If no test exists, show dialog to choose between test and formula
        const sample = suggestions.find(s => s.id === sampleId);
        if (sample) {
          setSelectedSample(sample);
          setIsDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking for existing tests:', error);
      // Fallback to default navigation
      navigate(`/test-management?createFor=${sampleId}`);
    }
  };

  const handleSelectTest = () => {
    if (selectedSample) {
      navigate(`/test-management?createFor=${selectedSample.id}`);
    }
    setIsDialogOpen(false);
    setSelectedSample(null);
  };

  const handleSelectFormula = () => {
    if (selectedSample) {
      // Set the sample as the primary sample in localStorage for the formula page to pick up
      localStorage.setItem('nbslims_open_formula_sample_id', selectedSample.id);
      navigate('/formulas');
    }
    setIsDialogOpen(false);
    setSelectedSample(null);
  };

  const handleViewSample = (sampleId: string) => {
    navigate(`/samples?view=${sampleId}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-blue-600" />
              Testing Suggestions
            </CardTitle>
            <CardDescription>
              Samples prioritized for testing based on priority level and waiting time
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTestingSuggestions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No samples waiting for testing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((sample, index) => (
              <div
                key={sample.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                      <Badge className={getPriorityColor(sample.priorityLevel)}>
                        <span>{sample.priorityLevel}</span>
                      </Badge>
                      <Badge className={getStatusColor(sample.status)}>
                        {sample.status}
                      </Badge>
                      {sample.daysWaiting > 7 && (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 mr-1" />
                          {sample.daysWaiting}d waiting
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">
                        {sample.itemNameEN}
                        {sample.sampleId && (
                          <span className="text-gray-500 ml-2">({sample.sampleId})</span>
                        )}
                      </h4>
                      {sample.itemNameAR && (
                        <p className="text-xs text-gray-600 font-arabic" dir="rtl">
                          {sample.itemNameAR}
                        </p>
                      )}
                      {sample.concept && (
                        <p className="text-xs text-gray-500">
                          Concept: {sample.concept}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSample(sample.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTestSample(sample.id)}
                      className={sample.hasTest ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      {sample.hasTest ? 'View Test' : 'Test Now'}
                    </Button>
                    {sample.hasTest && sample.testCount && sample.testCount > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {sample.testCount} tests
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Priority explanation */}
                {sample.priorityLevel === 'Critical' && sample.daysWaiting > 14 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Critical priority sample waiting {sample.daysWaiting} days - requires immediate attention
                  </div>
                )}
              </div>
            ))}
            
            {suggestions.length >= 10 && (
              <div className="text-center pt-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/samples?filter=untested')}
                >
                  View All Untested Samples
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <TestFormulaDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSample(null);
        }}
        onSelectTest={handleSelectTest}
        onSelectFormula={handleSelectFormula}
        sampleName={selectedSample?.itemNameEN || ''}
      />
    </Card>
  );
};
