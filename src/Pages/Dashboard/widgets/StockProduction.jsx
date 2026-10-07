// Pages/Dashboard/widgets/StockProduction.jsx
import React from 'react';
import { Package } from 'lucide-react';
import { STOCK_CONFIG, iconColor } from '../utils/dashboardHelpers';

const StockProduction = ({ values, finishedDetail, ingredientDetail, lastFetchTime }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Package className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Stock & Production
        </h3>
        <span className="ml-auto text-xs text-gray-400">
          Updated: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : 'Never'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {STOCK_CONFIG.map(cfg => {
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

      {finishedDetail.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Finished Product Stock (by product & size)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {finishedDetail.map(it => (
              <div key={it.id} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs font-medium text-gray-700">{it.productName}</p>
                <p className="text-xs text-gray-500">{it.size}</p>
                <p className="text-sm font-bold text-gray-900">{it.stock} {it.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ingredientDetail.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Ingredient Stock (by ingredient & unit)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {ingredientDetail.slice(0, 8).map(it => (
              <div key={it.id} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs font-medium text-gray-700">{it.name}</p>
                <p className="text-sm font-bold text-gray-900">{it.stock} {it.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockProduction;