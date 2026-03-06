import React from 'react';
import { Users, Trophy, Video, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description, colorClass, bgClass }) => (
  <div className={`p-6 rounded-3xl border ${bgClass || 'bg-white/5 border-white/10'}`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">{title}</span>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </div>
    <div className={`text-4xl font-black mt-1 ${colorClass}`}>{value}</div>
    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-2">{description}</p>
  </div>
);

const TeamStats = ({ stats }) => {
  const {
    totalPlayers,
    activePlayers,
    gamesAnalyzed,
    totalVideos,
    winRate,
    gamesPlayed,
    trainingVideos,
  } = stats;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Players"
        value={totalPlayers}
        icon={Users}
        description={`${activePlayers} currently active`}
        colorClass="text-orange-500"
        bgClass="bg-orange-500/10 border-orange-500/20"
      />
      <StatCard
        title="Win Rate"
        value={`${winRate}%`}
        icon={Trophy}
        description="Season performance"
        colorClass="text-green-500"
        bgClass="bg-green-500/10 border-green-500/20"
      />
      <StatCard
        title="Analyzed"
        value={gamesAnalyzed}
        icon={Video}
        description={`${totalVideos} total videos`}
        colorClass="text-blue-500"
        bgClass="bg-blue-500/10 border-blue-500/20"
      />
      <StatCard
        title="Played"
        value={gamesPlayed}
        icon={TrendingUp}
        description="This season"
        colorClass="text-yellow-500"
        bgClass="bg-yellow-500/10 border-yellow-500/20"
      />
    </div>
  );
};

export default TeamStats;