// Pages/DailySales/widgets/StatusBadge.jsx
import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const cfg = {
    completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', Icon: CheckCircle, label: 'Completed' },
    partial:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', Icon: Clock, label: 'Partial' },
    pending:   { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', Icon: AlertTriangle, label: 'Pending' }
  }[status] || { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', Icon: AlertTriangle, label: 'Pending' };
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

export default StatusBadge;