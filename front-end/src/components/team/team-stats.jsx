import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, Trophy, Video, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description, className }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${className}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Players"
        value={totalPlayers}
        icon={Users}
        description={`${activePlayers} currently active`}
        className="text-blue-600"
      />
      <StatCard
        title="Win Rate"
        value={`${winRate}%`}
        icon={Trophy}
        description="Season performance"
        className="text-green-600"
      />
      <StatCard
        title="Games Analyzed"
        value={gamesAnalyzed}
        icon={Video}
        description={`${totalVideos} total videos`}
        className="text-purple-600"
      />
      <StatCard
        title="Games Played"
        value={gamesPlayed}
        icon={TrendingUp}
        description="This season"
        className="text-orange-600"
      />
    </div>
  );
};

export default TeamStats; 