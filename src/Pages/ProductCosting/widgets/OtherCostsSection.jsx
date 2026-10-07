// src/Pages/ProductCosting/widgets/OtherCostsSection.jsx
import React from 'react';
import { CircleDollarSign, Users, Zap, Cog, FileText } from 'lucide-react';
import SectionShell from './SectionShell';
import { fmt } from '../utils/costingHelpers';

const FIELDS = [
  { key: 'labour',         label: 'Labour',            Icon: Users,    bg: 'bg-violet-100', text: 'text-violet-600' },
  { key: 'gasElectricity', label: 'Gas / Electricity', Icon: Zap,      bg: 'bg-amber-100',  text: 'text-amber-600' },
  { key: 'grinding',       label: 'Grinding',          Icon: Cog,      bg: 'bg-cyan-100',   text: 'text-cyan-600' },
  { key: 'other',          label: 'Other',             Icon: FileText, bg: 'bg-slate-100',  text: 'text-slate-600' }
];

const OtherCostsSection = ({ otherCosts, onChange, scaleFactor, isEditing, otherTotal }) => {
  return (
    <SectionShell
      icon={CircleDollarSign}
      iconColor={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
      title="Other Production Costs"
      subtitle="Labour • Gas/Electricity • Grinding • Other"
      badge={
        scaleFactor !== 1 && (
          <span className="text-[10px] md:text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
            ×{scaleFactor.toFixed(2)}
          </span>
        )
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {FIELDS.map(f => {
          const Icon = f.Icon;
          const rawValue = Number(otherCosts?.[f.key]) || 0;
          return (
            <div key={f.key} className="rounded-xl ring-1 ring-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${f.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${f.text}`} />
                </div>
                <span className="text-xs font-semibold text-slate-600 truncate">{f.label}</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  value={otherCosts?.[f.key] ?? ''}
                  onChange={e => onChange(f.key, e.target.value)}
                  placeholder="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 ring-1 ring-slate-200 text-sm font-semibold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              ) : (
                <p className="text-base font-bold text-slate-900 text-right">{fmt(rawValue)}</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-500">Total Other</span>
        <span className="text-base font-bold text-orange-600">{fmt(otherTotal)}</span>
      </div>
    </SectionShell>
  );
};

export default OtherCostsSection;