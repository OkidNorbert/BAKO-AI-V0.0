import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { format } from 'date-fns';

const GameItem = ({ game }) => {
  const getGameIcon = (type) => {
    switch (type) {
      case 'win':
        return '🏆';
      case 'loss':
        return '�';
      case 'draw':
        return '🤝';
      case 'analysis':
        return '�';
      case 'training':
        return '🏀';
      case 'video':
        return '🎥';
      default:
        return '📝';
    }
  };

  const getGameColor = (type) => {
    switch (type) {
      case 'win':
        return 'text-green-600';
      case 'loss':
        return 'text-red-600';
      case 'draw':
        return 'text-amber-600';
      case 'analysis':
        return 'text-purple-600';
      case 'training':
        return 'text-blue-600';
      case 'video':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 hover:bg-accent rounded-lg transition-colors">
      <div className="text-2xl">{getGameIcon(game.type)}</div>
      <div className="flex-1 space-y-1">
        <p className={`font-medium ${getGameColor(game.type)}`}>
          {game.title}
        </p>
        <p className="text-sm text-muted-foreground">{game.description}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(game.date), 'PPp')}
        </p>
      </div>
    </div>
  );
};

const RecentGames = ({ games }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Games</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {games.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No recent games
            </p>
          ) : (
            games.map((game) => (
              <GameItem key={game.id} game={game} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentGames; 