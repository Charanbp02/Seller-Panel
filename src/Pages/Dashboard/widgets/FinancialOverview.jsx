// Pages/Dashboard/widgets/FinancialOverview.jsx
import React from 'react';
import { Wallet } from 'lucide-react';
import { FINANCIAL_CONFIG, iconColor } from '../utils/dashboardHelpers';

const FinancialOverview = ({ values }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Wallet className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Financial Overview
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {FINANCIAL_CONFIG.map(cfg => {
          const Icon = cfg.icon;
          const v = values[cfg.id] || {};
          return (
            <div key={cfg.id} className={`${cfg.bg} rounded-xl p-4 hover:shadow-md transition-all`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white shadow-sm ${iconColor(cfg.color)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 font-medium">{cfg.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{v.value ?? '—'}</p>
                  {v.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 break-words">{v.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialOverview;