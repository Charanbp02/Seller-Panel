// src/Pages/ProductCosting/widgets/SectionShell.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SectionShell = ({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
  action,
  children,
  defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/95 backdrop-blur rounded-2xl md:rounded-3xl shadow-lg shadow-slate-200/40 ring-1 ring-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className={`p-2 md:p-2.5 rounded-xl ${iconColor.bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${iconColor.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm md:text-base font-semibold text-slate-900 truncate">{title}</h2>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate-500 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
        <div className="text-slate-400 flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && <div className="px-4 md:px-5 pb-4 md:pb-5">{children}</div>}
    </div>
  );
};

export default SectionShell;