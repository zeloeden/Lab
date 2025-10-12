import React from 'react';
import { Formula } from '@/lib/formula-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GitBranch, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormulaLineageProps {
  currentFormula: Formula;
  allFormulas: Formula[];
  onFormulaSelect?: (formula: Formula) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'Retest': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'Testing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Untested': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const FormulaLineage: React.FC<FormulaLineageProps> = ({
  currentFormula,
  allFormulas,
  onFormulaSelect,
}) => {
  // Find predecessor (parent)
  const predecessor = currentFormula.predecessorFormulaId
    ? allFormulas.find(f => f.id === currentFormula.predecessorFormulaId)
    : null;

  // Find successors (children)
  const successors = currentFormula.successorFormulaIds
    ? allFormulas.filter(f => currentFormula.successorFormulaIds!.includes(f.id))
    : [];

  // Build the complete lineage chain going backwards
  const buildAncestryChain = (formula: Formula): Formula[] => {
    const chain: Formula[] = [formula];
    let current = formula;
    
    while (current.predecessorFormulaId) {
      const parent = allFormulas.find(f => f.id === current.predecessorFormulaId);
      if (!parent) break;
      chain.unshift(parent);
      current = parent;
    }
    
    return chain;
  };

  const ancestryChain = buildAncestryChain(currentFormula);
  const hasLineage = predecessor || successors.length > 0;

  if (!hasLineage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" />
            Version Lineage
          </CardTitle>
          <CardDescription>
            No version history for this formula
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const FormulaCard: React.FC<{ formula: Formula; isCurrent?: boolean }> = ({ formula, isCurrent }) => (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-all',
        isCurrent 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{formula.name}</h4>
            {isCurrent && (
              <Badge variant="outline" className="text-xs">Current</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2">{formula.internalCode}</p>
          <Badge className={cn('text-xs', getStatusColor(formula.status))}>
            {formula.status}
          </Badge>
        </div>
        {onFormulaSelect && !isCurrent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormulaSelect(formula)}
            className="ml-2"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(formula.createdAt).toLocaleDateString()}</span>
        </div>
        {formula.approvedBy && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Approved by {formula.approvedBy}</span>
          </div>
        )}
        {formula.attemptsTotal && (
          <div className="text-xs">
            <span>Test attempts: {formula.attemptsTotal}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="h-5 w-5" />
          Version Lineage
        </CardTitle>
        <CardDescription>
          Formula evolution and related versions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ancestry Chain */}
        {ancestryChain.length > 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ArrowUp className="h-4 w-4" />
              Version History ({ancestryChain.length} versions)
            </h4>
            <div className="space-y-3">
              {ancestryChain.map((formula, index) => (
                <div key={formula.id}>
                  <FormulaCard 
                    formula={formula} 
                    isCurrent={formula.id === currentFormula.id} 
                  />
                  {index < ancestryChain.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ArrowDown className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Formula (if not shown in chain) */}
        {ancestryChain.length === 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Current Version</h4>
            <FormulaCard formula={currentFormula} isCurrent />
          </div>
        )}

        {/* Successors */}
        {successors.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <ArrowDown className="h-5 w-5 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Derived Versions ({successors.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {successors.map(formula => (
                <FormulaCard key={formula.id} formula={formula} />
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Lineage Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Generation:</span>
              <span className="ml-2 font-medium">{ancestryChain.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Variants:</span>
              <span className="ml-2 font-medium">{successors.length}</span>
            </div>
            {predecessor && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Parent:</span>
                <span className="ml-2 font-medium">{predecessor.internalCode}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <Badge className={cn('ml-2 text-xs', getStatusColor(currentFormula.status))}>
                {currentFormula.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

