// Pages/Dashboard/widgets/QuickActions.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, TrendingDown, Package, Plus, Users, MoreVertical, Zap
} from 'lucide-react';

const QUICK_ACTIONS = [
  { path: '/daily-sales', label: 'Record Sale',    icon: ShoppingBag,  bg: 'bg-blue-50',   color: 'text-blue-600' },
  { path: '/expenses',    label: 'Add Expense',    icon: TrendingDown, bg: 'bg-red-50',    color: 'text-red-600' },
  { path: '/production',  label: 'Add Production', icon: Package,      bg: 'bg-cyan-50',   color: 'text-cyan-600' },
  { path: '/purchase',    label: 'Add Purchase',   icon: Plus,         bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { path: '/customers',   label: 'Customers',      icon: Users,        bg: 'bg-purple-50', color: 'text-purple-600' },
  { path: '/settings',    label: 'More',           icon: MoreVertical, bg: 'bg-gray-50',   color: 'text-gray-600' }
];

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-orange-500" />
        <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
        <span className="text-xs text-gray-400 ml-2">(Stock changes happen in modules)</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group">
              <div className={`p-2.5 ${a.bg} rounded-xl ${a.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;