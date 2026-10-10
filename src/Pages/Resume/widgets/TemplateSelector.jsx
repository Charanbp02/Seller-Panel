// src/Pages/Resume/widgets/TemplateSelector.jsx
import React from 'react';
import { Palette, Check } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column, colorful',
    preview: (accent) => (
      <div className="w-full h-full flex">
        <div className="w-1/3 h-full rounded-l" style={{ backgroundColor: accent }} />
        <div className="flex-1 p-1 space-y-1">
          <div className="h-1 bg-gray-300 rounded w-3/4" />
          <div className="h-1 bg-gray-200 rounded" />
          <div className="h-1 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    ),
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional, formal',
    preview: (accent) => (
      <div className="w-full h-full p-1 space-y-1">
        <div className="h-2 bg-gray-400 rounded w-1/2 mx-auto" />
        <div className="h-px my-1" style={{ backgroundColor: accent }} />
        <div className="h-1 bg-gray-200 rounded" />
        <div className="h-1 bg-gray-200 rounded w-4/5" />
        <div className="h-1 bg-gray-200 rounded w-5/6" />
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, contemporary',
    preview: (accent) => (
      <div className="w-full h-full p-1 space-y-1">
        <div className="h-2 bg-gray-800 rounded w-2/3" />
        <div className="h-1 bg-gray-200 rounded w-1/2" />
        <div className="h-px bg-gray-200 my-1" />
        <div className="h-1 bg-gray-200 rounded" />
        <div className="h-1 bg-gray-200 rounded w-5/6" />
      </div>
    ),
  },
];

const ACCENT_COLORS = [
  { name: 'Blue',      value: '#2563eb' },
  { name: 'Indigo',    value: '#4f46e5' },
  { name: 'Purple',    value: '#7c3aed' },
  { name: 'Pink',      value: '#db2777' },
  { name: 'Red',       value: '#dc2626' },
  { name: 'Orange',    value: '#ea580c' },
  { name: 'Amber',     value: '#d97706' },
  { name: 'Emerald',   value: '#059669' },
  { name: 'Teal',      value: '#0d9488' },
  { name: 'Cyan',      value: '#0891b2' },
  { name: 'Slate',     value: '#475569' },
  { name: 'Black',     value: '#111827' },
];

const TemplateSelector = ({ template, accentColor, onChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-700">Design</h3>
      </div>

      {/* Template picker */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Template</p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange({ template: t.id })}
              className={`relative rounded-lg border-2 p-2 transition-all ${
                template === t.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-full aspect-[3/4] bg-white rounded mb-1.5 overflow-hidden border border-gray-100">
                {t.preview(accentColor)}
              </div>
              <p className="text-[10px] font-semibold text-gray-800 text-center">
                {t.name}
              </p>
              <p className="text-[8px] text-gray-500 text-center leading-tight">
                {t.description}
              </p>
              {template === t.id && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Accent Color</p>
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange({ accentColor: c.value })}
              title={c.name}
              className={`relative w-full aspect-square rounded-lg border-2 transition-all ${
                accentColor === c.value
                  ? 'border-gray-800 scale-110 shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
            >
              {accentColor === c.value && (
                <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;