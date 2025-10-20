import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Database, Trash2, Loader2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { seedService } from '@/services/seedService';

export const SeedDataButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const result = await seedService.seedAll();
      if (result.success) {
        toast.success('🌱 System seeded with test data!', {
          description: 'All modules have been populated with sample data. Refresh the page to see changes.'
        });
        setShowSeedDialog(false);
        
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to seed data', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Failed to seed data', {
        description: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    setLoading(true);
    try {
      const result = await seedService.clearAll();
      if (result.success) {
        toast.success('🗑️ All data cleared!', {
          description: 'System has been reset. Refresh the page to see changes.'
        });
        setShowClearDialog(false);
        
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to clear data', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Failed to clear data', {
        description: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixFormulaIds = () => {
    setLoading(true);
    try {
      const formulas = JSON.parse(localStorage.getItem('nbslims_formulas') || '[]');
      const samples = JSON.parse(localStorage.getItem('nbslims_enhanced_samples') || '[]');
      
      if (formulas.length === 0) {
        toast.error('No formulas found');
        setLoading(false);
        return;
      }
      
      if (samples.length === 0) {
        toast.error('No samples found');
        setLoading(false);
        return;
      }
      
      let updatedCount = 0;
      const issues: string[] = [];
      
      // For each formula
      formulas.forEach(formula => {
        const formulaName = formula.name || formula.formulaName || 'Unknown';
        
        if (!formula.ingredients || formula.ingredients.length === 0) {
          return;
        }
        
        // For each ingredient
        formula.ingredients.forEach((ing: any, idx: number) => {
          const oldId = ing.rawMaterialId;
          
          if (!oldId) return;
          
          // Check if this ID exists in samples
          const exists = samples.find((s: any) => s.id === oldId);
          
          if (exists) {
            return; // ID is valid
          }
          
          // ID doesn't exist - try to find by code
          const code = ing.code;
          if (code) {
            const matchByCode = samples.find((s: any) => 
              s.code === code || 
              s.customIdNo === code
            );
            
            if (matchByCode) {
              ing.rawMaterialId = matchByCode.id;
              updatedCount++;
              issues.push(`✅ Fixed "${formulaName}" ingredient ${idx + 1} (code: ${code})`);
              return;
            }
          }
          
          issues.push(`❌ Could not fix "${formulaName}" ingredient ${idx + 1} (old ID: ${oldId})`);
        });
      });
      
      if (updatedCount > 0) {
        // Save updated formulas
        localStorage.setItem('nbslims_formulas', JSON.stringify(formulas));
        toast.success(`🔧 Fixed ${updatedCount} formula ingredient(s)!`, {
          description: 'Refresh the page to see changes.'
        });
        
        // Show detailed log in console
        console.log('Formula Fix Results:');
        issues.forEach(issue => console.log(issue));
        
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.info('No fixes needed', {
          description: 'All formula ingredient IDs are valid.'
        });
      }
    } catch (error) {
      console.error('Fix error:', error);
      toast.error('Failed to fix formulas', {
        description: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Data Management
          </CardTitle>
          <CardDescription>
            Seed the system with comprehensive test data or clear all data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Seed Data Includes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>32 Fragrance Samples (with Arabic names, ledger data, customer info)</li>
              <li>24 Raw Materials (solvents, aroma chemicals)</li>
              <li>8 Suppliers (Givaudan, Firmenich, IFF, Symrise, etc.)</li>
              <li>6 Customers (from different countries)</li>
              <li>5 Formulas (with ingredients and proper structure)</li>
              <li>15 Tests (with various statuses and results)</li>
              <li>8 Tasks (assigned to different team members)</li>
              <li>5 Purchase Orders (with line items)</li>
              <li>3 Companies (with initials and settings)</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowSeedDialog(true)}
                className="flex-1"
                variant="default"
              >
                <Database className="h-4 w-4 mr-2" />
                Seed Test Data
              </Button>
              
              <Button 
                onClick={() => setShowClearDialog(true)}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </div>
            
            <Button 
              onClick={handleFixFormulaIds}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix Formula IDs
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Development Only:</strong> This feature is for testing purposes. 
                The page will automatically reload after seeding or clearing data.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seed Confirmation Dialog */}
      <Dialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seed Test Data?</DialogTitle>
            <DialogDescription>
              This will add comprehensive test data to your system including samples, 
              formulas, tests, suppliers, customers, and more. The page will reload automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSeedDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSeedData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Clear All Data?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL data from the system including:
              samples, formulas, tests, suppliers, customers, purchase orders, and tasks.
              This action cannot be undone. The page will reload automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

