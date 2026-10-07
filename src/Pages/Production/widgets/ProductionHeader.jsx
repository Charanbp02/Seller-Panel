// Pages/Production/widgets/ProductionHeader.jsx
import React from 'react';
import { Factory, Calendar, Plus } from 'lucide-react';

const ProductionHeader = ({ selectedDate, setSelectedDate, onAdd }) => (
  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl shadow-lg p-4 md:p-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
          <Factory className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Production</h1>
          <p className="text-cyan-100 text-sm">
            Track production • Auto-consume packing materials
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-2 rounded-xl border border-white/30">
          <Calendar className="w-4 h-4 text-white" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent outline-none text-sm text-white w-32 [color-scheme:dark]"
          />
        </div>
        <button
          onClick={onAdd}
          className="bg-white text-cyan-600 hover:bg-cyan-50 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Production</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </div>
  </div>
);

export default ProductionHeader;