/**
 * Simple test component for Phase 2
 */

import React from 'react';

export const TestPhase2: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">Label Editor Phase 2 Test</h1>
      <p className="text-gray-600 mt-4">This is a simple test to verify the route is working.</p>
      <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-lg">
        <h2 className="text-lg font-semibold text-green-800">✅ Route Working!</h2>
        <p className="text-green-700">The Phase 2 route is accessible and rendering correctly.</p>
      </div>
    </div>
  );
};

