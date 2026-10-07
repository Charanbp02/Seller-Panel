// Pages/Dashboard/widgets/DashboardHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, FileText, RefreshCw } from 'lucide-react';

const DashboardHeader = ({ selectedDate, setSelectedDate, isFetching, onRefresh }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Business Dashboard
              
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time business overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 w-32"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">View Reports</span>
            <span className="sm:hidden">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;