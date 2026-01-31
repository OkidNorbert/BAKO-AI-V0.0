import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MultiLineChart } from '../ui/chart';

const AdminDashboardChart = ({ data }) => {
  const lines = [
    { key: 'children', name: 'Players' },
    { key: 'attendance', name: 'Attendance' },
    { key: 'payments', name: 'Payments' },
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
          title="Monthly Statistics"
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Players</p>
            <p className="text-2xl font-bold text-blue-600">
              {data[data.length - 1]?.children || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Average Attendance</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(data[data.length - 1]?.attendance || 0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-2xl font-bold text-purple-600">
              ${data[data.length - 1]?.payments?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardChart; 