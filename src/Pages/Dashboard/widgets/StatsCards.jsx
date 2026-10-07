// Pages/Dashboard/widgets/StatsCards.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { STATS_CONFIG, iconColor } from '../utils/dashboardHelpers';

const StatsCards = ({ values }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATS_CONFIG.map(cfg => {
        const Icon = cfg.icon;
        const v = values[cfg.id] || {};
        const pos = String(v.change || '').startsWith('+') || v.change === 'New';
        const bg = cfg.color === 'blue' ? 'bg-blue-50'
                 : cfg.color === 'green' ? 'bg-green-50'
                 : cfg.color === 'red' ? 'bg-red-50'
                 : 'bg-emerald-50';
        return (
          <div key={cfg.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`w-4 h-4 ${iconColor(cfg.color)}`} />
              </div>
              <p className="text-sm font-medium text-gray-600">{cfg.label}</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              {v.value ?? '—'}
            </p>
            <div className="flex flex-col gap-0.5 mt-1.5">
              <span className={`inline-flex items-center text-sm font-medium ${pos ? 'text-green-600' : 'text-red-600'}`}>
                {pos ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {v.change || ''}
              </span>
              <span className="text-xs text-gray-500">{v.subtitle || ''}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;