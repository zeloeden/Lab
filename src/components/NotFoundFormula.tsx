import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listFormulaCodes } from '@/services/formulas';
import { AlertCircle, ArrowRight } from 'lucide-react';

export function NotFoundFormula({ code }: { code: string }) {
  const navigate = useNavigate();
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFormulaCodes(8).then(codes => {
      setAvailableCodes(codes);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Error Header */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-900">
            Formula not found
          </h2>
          <p className="text-red-700 mt-1">
            Could not find formula with code: <code className="bg-red-100 px-2 py-0.5 rounded font-mono text-sm">{code}</code>
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-700">
          This formula code doesn't exist in your database. This could happen if:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
          <li>The QR code was generated from a different system</li>
          <li>The formula was deleted</li>
          <li>The database was recently reset</li>
          <li>The code was misread by the scanner</li>
        </ul>
      </div>

      {/* Available Formulas */}
      {loading ? (
        <div className="text-center py-4 text-gray-500">
          Loading available formulas...
        </div>
      ) : availableCodes.length > 0 ? (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            Available formula codes:
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableCodes.map(c => (
              <code 
                key={c} 
                className="bg-white px-3 py-1 rounded border border-blue-300 text-blue-700 font-mono text-sm"
              >
                {c}
              </code>
            ))}
          </div>
          {availableCodes.length >= 8 && (
            <p className="text-xs text-blue-600 mt-2">
              ...and more. View all formulas to see the complete list.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 font-semibold">
            Your database is empty
          </p>
          <p className="text-yellow-700 text-sm mt-1">
            You need to create formulas first or load sample data.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => navigate('/formulas')}
          className="flex-1"
          size="lg"
        >
          <span>View All Formulas</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        {availableCodes.length === 0 && (
          <Button
            onClick={() => {
              try {
                const { initializeSampleData } = require('@/utils/sampleDataInitializer');
                initializeSampleData();
                window.location.reload();
              } catch (e) {
                console.error('Failed to load sample data:', e);
              }
            }}
            variant="outline"
            size="lg"
          >
            Load Sample Data
          </Button>
        )}
      </div>
    </div>
  );
}

