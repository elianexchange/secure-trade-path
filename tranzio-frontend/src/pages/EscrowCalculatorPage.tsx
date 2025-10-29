import React from 'react';
import { EscrowCalculator } from '@/components/EscrowCalculator';

export default function EscrowCalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Escrow Fee Calculator
          </h1>
          <p className="text-gray-600">
            Calculate dynamic escrow fees based on transaction risk factors. 
            Get detailed breakdowns and recommendations to optimize your transaction costs.
          </p>
        </div>
        
        <EscrowCalculator />
      </div>
    </div>
  );
}
