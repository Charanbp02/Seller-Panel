// Pages/PackingMaterials/widgets/PackingHeader.jsx
import React from 'react';
import { Box, Calendar, Plus } from 'lucide-react';

const PackingHeader = ({ selectedDate, setSelectedDate, onAdd }) => (
  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-4 md:p-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
          <Box className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Packing Materials</h1>
          <p className="text-indigo-100 text-sm">Manage packing materials inventory</p>
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
          className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Material</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </div>
  </div>
);

export default PackingHeader;