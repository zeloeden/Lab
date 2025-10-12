import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Formula, RawMaterial } from '@/lib/formula-types';
import { 
  Beaker, 
  FlaskConical, 
  Droplets,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface FormulaVisualizationProps {
  formula: Formula;
  rawMaterials: RawMaterial[];
}

export const FormulaVisualization: React.FC<FormulaVisualizationProps> = ({
  formula,
  rawMaterials
}) => {
  // Get colors for ingredients based on percentage
  const getIngredientColor = (percentage: number): string => {
    if (percentage >= 30) return 'bg-blue-500';
    if (percentage >= 20) return 'bg-green-500';
    if (percentage >= 10) return 'bg-yellow-500';
    if (percentage >= 5) return 'bg-orange-500';
    return 'bg-purple-500';
  };

  // Calculate the visual height for bar chart
  const maxPercentage = Math.max(...formula.ingredients.map(ing => ing.percentage));
  
  return (
    <div className="space-y-6">
      {/* Formula Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Formula Composition: {formula.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Batch Size</p>
              <p className="text-xl font-bold">{formula.batchSize} {formula.batchUnit}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-xl font-bold text-green-600">${formula.totalCost.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Cost per Unit</p>
              <p className="text-xl font-bold">${formula.costPerUnit.toFixed(3)}/{formula.batchUnit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Percentage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 flex items-center justify-center">
            {/* Simple Pie Chart using CSS */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {(() => {
                  let cumulativePercentage = 0;
                  return formula.ingredients.map((ing, index) => {
                    const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                    const startAngle = (cumulativePercentage / 100) * 360;
                    const endAngle = ((cumulativePercentage + ing.percentage) / 100) * 360;
                    
                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                    
                    const largeArcFlag = ing.percentage > 50 ? 1 : 0;
                    
                    const pathData = `
                      M 50 50
                      L ${x1} ${y1}
                      A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
                      Z
                    `;
                    
                    cumulativePercentage += ing.percentage;
                    
                    const colors = [
                      'fill-blue-500',
                      'fill-green-500',
                      'fill-yellow-500',
                      'fill-orange-500',
                      'fill-purple-500',
                      'fill-pink-500',
                      'fill-indigo-500',
                      'fill-red-500'
                    ];
                    
                    return (
                      <path
                        key={ing.id}
                        d={pathData}
                        className={colors[index % colors.length]}
                        opacity="0.9"
                      />
                    );
                  });
                })()}
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formula.totalPercentage}%</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 space-y-2">
            {formula.ingredients.map((ing, index) => {
              const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
              const colors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-yellow-500',
                'bg-orange-500',
                'bg-purple-500',
                'bg-pink-500',
                'bg-indigo-500',
                'bg-red-500'
              ];
              
              return (
                <div key={ing.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <span className="text-sm font-medium">
                      {material?.itemNameEN || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{ing.percentage}%</Badge>
                    <span className="text-sm text-gray-500">
                      {((formula.batchSize * ing.percentage) / 100).toFixed(2)} {formula.batchUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ingredient Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formula.ingredients
              .sort((a, b) => b.percentage - a.percentage)
              .map((ing, index) => {
                const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                const barWidth = (ing.percentage / maxPercentage) * 100;
                
                return (
                  <div key={ing.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {material?.itemNameEN || 'Unknown'}
                      </span>
                      <span className="text-gray-500">
                        {ing.percentage}% • {((formula.batchSize * ing.percentage) / 100).toFixed(2)} {formula.batchUnit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getIngredientColor(ing.percentage)} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                          {ing.percentage}%
                        </span>
                      </div>
                    </div>
                    {ing.notes && (
                      <p className="text-xs text-gray-500 italic">{ing.notes}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Scientific Formula Notation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Scientific Formula Notation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
            <p className="font-bold mb-2">{formula.name}</p>
            <div className="space-y-1">
              {formula.ingredients.map((ing, index) => {
                const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                return (
                  <div key={ing.id}>
                    <span className="text-gray-600">{String(index + 1).padStart(2, '0')}.</span>
                    {' '}
                    <span className="font-medium">{material?.itemNameEN || 'Unknown'}</span>
                    {' '}
                    <span className="text-blue-600">{ing.percentage.toFixed(2)}%</span>
                    {' '}
                    <span className="text-gray-500">
                      ({((formula.batchSize * ing.percentage) / 100).toFixed(2)} {formula.batchUnit})
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-2">
                <span className="font-bold">Total:</span>
                {' '}
                <span className="text-green-600">{formula.totalPercentage.toFixed(2)}%</span>
                {' = '}
                <span>{formula.batchSize} {formula.batchUnit}</span>
              </div>
            </div>
          </div>
          
          {/* Chemical-style representation */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Formula Representation:</p>
            <p className="font-mono text-lg">
              {formula.ingredients.map((ing, index) => {
                const material = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                const abbreviation = material?.itemNameEN?.substring(0, 3).toUpperCase() || 'UNK';
                return (
                  <span key={ing.id}>
                    {index > 0 && ' + '}
                    <span className="font-bold">{abbreviation}</span>
                    <sub className="text-xs">{ing.percentage}%</sub>
                  </span>
                );
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
