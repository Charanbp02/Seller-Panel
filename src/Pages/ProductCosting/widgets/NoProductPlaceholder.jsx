// src/Pages/ProductCosting/widgets/NoProductPlaceholder.jsx
import React from 'react';
import { ChartPie } from 'lucide-react';

const NoProductPlaceholder = () => (
  <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 p-8 md:p-16 text-center">
    <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
      <ChartPie className="w-10 h-10 text-purple-500" />
    </div>
    <p className="text-slate-800 font-semibold text-base md:text-lg">
      Select a product to see its costing
    </p>
    <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-md mx-auto">
      Recipe, ingredient costs, packing costs, other costs, selling price ಮತ್ತು profit ಎಲ್ಲವೂ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.
    </p>
  </div>
);

export default NoProductPlaceholder;