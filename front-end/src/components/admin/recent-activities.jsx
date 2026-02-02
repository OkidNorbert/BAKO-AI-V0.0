import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'attendance':
        return '👋';
      case 'payment':
        return '💰';
      case 'incident':
        return '⚠️';
      case 'budget':
        return '💼';
      case 'child':
        return '👶';
      case 'babysitter':
        return '👩‍⚕️';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'attendance':
        return 'text-blue-600';
      case 'payment':
        return 'text-green-600';
      case 'incident':
        return 'text-amber-600';
      case 'budget':
        return 'text-purple-600';
      case 'child':
        return 'text-pink-600';
      case 'babysitter':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-accent rounded-lg transition-colors">
      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
      <div className="flex-1 space-y-1">
        <p className={`font-medium ${getActivityColor(activity.type)}`}>
          {activity.title}
        </p>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(activity.date), 'PPp')}
        </p>
      </div>
    </div>
  );
};

const RecentActivities = ({ activities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent activities
            </p>
          ) : (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities; 