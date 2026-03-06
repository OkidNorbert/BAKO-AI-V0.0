import React from 'react';
import { MultiLineChart } from '../ui/chart';

const TeamDashboardChart = ({ data }) => {
  const lines = [
    { key: 'players', name: 'Players' },
    { key: 'performance', name: 'Performance' },
    { key: 'games', name: 'Games' },
  ];

  return (
    <div className="w-full">
      <div className="rounded-2xl overflow-hidden glass-dark border border-white/5 p-4 bg-white/5">
        <MultiLineChart
          data={data}
          lines={lines}
          xKey="date"
          title="Team Performance Trends"
        />
      </div>
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Active Roster</p>
          <p className="text-2xl font-black text-blue-500">
            {data[data.length - 1]?.players || 0}
          </p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Win Rate</p>
          <p className="text-2xl font-black text-green-500">
            {Math.round(data[data.length - 1]?.performance || 0)}%
          </p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
          <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-1">Games</p>
          <p className="text-2xl font-black text-purple-500">
            {data[data.length - 1]?.games || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboardChart;