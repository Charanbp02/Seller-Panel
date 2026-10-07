// Pages/Dashboard/widgets/RecentActivity.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowUpRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { fmt2 } from '../utils/dashboardHelpers';

const txIcon = (t) =>
  t === 'Sale' ? TrendingUp : t === 'Expense' ? TrendingDown : DollarSign;

const txColor = (t) =>
  t === 'Sale' ? 'bg-green-50 text-green-600'
  : t === 'Expense' ? 'bg-red-50 text-red-600'
  : 'bg-blue-50 text-blue-600';

const statusText = (s) =>
  s === 'Completed' ? 'text-green-600'
  : s === 'Partial' ? 'text-yellow-600'
  : 'text-red-600';

const RecentActivity = ({ recent }) => {
  const navigate = useNavigate();
  const isEmpty = recent.length === 0 || recent[0].customer === 'No recent transactions';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <button
          onClick={() => navigate('/daily-sales')}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
          View All <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {isEmpty ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">No recent activity</p>
            <p className="text-sm">Transactions will appear here</p>
          </div>
        ) : recent.map(t => {
          const Icon = txIcon(t.type);
          return (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${txColor(t.type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.customer}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{t.type}</span>
                    <span>•</span>
                    <span className="truncate">{t.time}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-sm font-semibold text-gray-900">
                  {t.amount > 0 ? fmt2(t.amount) : '-'}
                </p>

                {/* Paid / Due hint */}
                {t.amount > 0 && t.paid > 0 && t.balance > 0 && (
                  <p className="text-xs text-gray-500">
                    Paid {fmt2(t.paid)} • Due {fmt2(t.balance)}
                  </p>
                )}
                {t.amount > 0 && t.paid === 0 && (
                  <p className="text-xs text-red-500 font-medium">Unpaid</p>
                )}

                <span className={`text-xs font-medium ${statusText(t.status)}`}>
                  {t.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;