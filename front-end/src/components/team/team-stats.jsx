import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, UserCheck, DollarSign, Calendar } from 'lucide-react';

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
    totalRevenue,
    pendingPayments,
    attendanceRate,
    upcomingEvents,
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
        title="Attendance Rate"
        value={`${attendanceRate}%`}
        icon={UserCheck}
        description="Average daily attendance"
        className="text-green-600"
      />
      <StatCard
        title="Total Revenue"
        value={`$${totalRevenue.toFixed(2)}`}
        icon={DollarSign}
        description={`$${pendingPayments.toFixed(2)} pending`}
        className="text-purple-600"
      />
      <StatCard
        title="Upcoming Events"
        value={upcomingEvents}
        icon={Calendar}
        description="Events this month"
        className="text-orange-600"
      />
    </div>
  );
};

export default TeamStats; 