// Pages/Dashboard/widgets/RecentActivity.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ArrowUpRight, TrendingUp, TrendingDown, DollarSign, PiggyBank, Users
} from 'lucide-react';
import { fmt2 } from '../utils/dashboardHelpers';

// ============================================================
// ICON — supports Sale / Expense / Investment / Owner
// ============================================================
const txIcon = (t) => {
  if (t === 'Sale') return TrendingUp;
  if (t === 'Expense') return TrendingDown;
  if (t === 'Investment') return PiggyBank;
  if (t === 'Owner') return Users;
  return DollarSign;
};

// ============================================================
// COLOR — supports Sale / Expense / Investment / Owner
// ============================================================
const txColor = (t) => {
  if (t === 'Sale') return 'bg-green-50 text-green-600';
  if (t === 'Expense') return 'bg-red-50 text-red-600';
  if (t === 'Investment') return 'bg-indigo-50 text-indigo-600';
  if (t === 'Owner') return 'bg-purple-50 text-purple-600';
  return 'bg-blue-50 text-blue-600';
};

// ============================================================
// STATUS
// ============================================================
const statusText = (s) => {
  if (s === 'Completed') return 'text-green-600';
  if (s === 'Partial') return 'text-yellow-600';
  if (s === 'Unpaid' || s === 'Pending') return 'text-red-600';
  return 'text-gray-600';
};

const RecentActivity = ({ recent }) => {
  const navigate = useNavigate();

  // ★ Null-safe + smart empty check
  const safeRecent = Array.isArray(recent) ? recent : [];
  const isEmpty =
    safeRecent.length === 0 ||
    safeRecent.every(t =>
      !t || t.id === 'empty' || t.customer === 'No recent transactions'
    );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <button
          onClick={() => navigate('/daily-sales')}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
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
        ) : (
          safeRecent.map((t, idx) => {
            const Icon = txIcon(t.type);
            const hasPaymentInfo =
              t.amount > 0 &&
              (Number(t.paid) > 0 || Number(t.balance) > 0);

            return (
              <div
                key={t.id || `row-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${txColor(t.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.customer || '—'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {t.type || 'Activity'}
                      </span>
                      <span>•</span>
                      <span className="truncate">{t.time || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {Number(t.amount) > 0 ? fmt2(t.amount) : '—'}
                  </p>

                  {/* Paid / Due hint — only for sales with payment tracking */}
                  {hasPaymentInfo && Number(t.paid) > 0 && Number(t.balance) > 0 && (
                    <p className="text-xs text-gray-500">
                      Paid {fmt2(t.paid)} • Due {fmt2(t.balance)}
                    </p>
                  )}
                  {hasPaymentInfo && Number(t.paid) === 0 && Number(t.balance) > 0 && (
                    <p className="text-xs text-red-500 font-medium">Unpaid</p>
                  )}

                  {t.status && (
                    <span className={`text-xs font-medium ${statusText(t.status)}`}>
                      {t.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivity;