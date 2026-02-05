import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MultiLineChart } from '../ui/chart';

const TeamDashboardChart = ({ data }) => {
  const lines = [
    { key: 'players', name: 'Players' },
    { key: 'performance', name: 'Performance' },
    { key: 'games', name: 'Games' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <MultiLineChart
          data={data}
          lines={lines}
          xKey="date"
          title="Team Performance Trends"
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Active Players</p>
            <p className="text-2xl font-bold text-blue-600">
              {data[data.length - 1]?.players || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(data[data.length - 1]?.performance || 0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Games Played</p>
            <p className="text-2xl font-bold text-purple-600">
              {data[data.length - 1]?.games || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamDashboardChart; 