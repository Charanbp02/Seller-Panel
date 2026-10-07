// Pages/Dashboard/widgets/LowStockAlerts.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { statusColor } from '../utils/dashboardHelpers';

const LowStockAlerts = ({ alerts }) => {
  const navigate = useNavigate();
  const criticalCount = alerts.filter(a => a.status === 'Critical').length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-semibold text-gray-900">Low Stock Alerts</h2>
          {alerts.length > 0 && (
            <span className="ml-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {criticalCount} Critical
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/ingredients')}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
          View All <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-medium">All stocks are healthy!</p>
            <p className="text-sm">No low stock alerts</p>
          </div>
        ) : alerts.map(a => (
          <div
            key={a.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${statusColor(a.status)}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{a.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5 flex-wrap">
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{a.category}</span>
                <span>•</span>
                <span>Current: <span className="font-medium">{a.current}</span></span>
                <span>•</span>
                <span>Min: {a.min}</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${statusColor(a.status)}`}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStockAlerts;