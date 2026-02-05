import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trophy, Shield, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getPositionBadgeClass = (position) => {
  switch (position?.toLowerCase()) {
    case 'point guard':
    case 'pg':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'shooting guard':
    case 'sg':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'small forward':
    case 'sf':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'power forward':
    case 'pf':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'center':
    case 'c':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const PlayerListItem = ({ player }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-gray-50">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
          {player.avatar ? (
            <img src={player.avatar} alt={player.firstName} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-gray-600 font-medium">
              {player.firstName?.charAt(0)}{player.lastName?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {player.firstName} {player.lastName}
          </h4>
          <p className="text-sm text-gray-500">#{player.number} • {player.email}</p>
        </div>
      </div>
      <Badge className={getPositionBadgeClass(player.position)}>
        {player.position}
      </Badge>
    </div>
  );
};

const PlayerManagement = ({ players = [] }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  
  const filteredPlayers = filter === 'all' 
    ? players 
    : players.filter(player => player.position?.toLowerCase() === filter.toLowerCase());
  
  const handleAddPlayer = () => {
    navigate('/team/roster/new');
  };
  
  const handleViewAllPlayers = () => {
    navigate('/team/roster');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-blue-500" />
          Player Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Button 
            size="sm" 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
          >
            <Users className="h-4 w-4 mr-1" />
            All
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'point guard' ? 'default' : 'outline'} 
            onClick={() => setFilter('point guard')}
          >
            <Shield className="h-4 w-4 mr-1" />
            Guards
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'forward' ? 'default' : 'outline'} 
            onClick={() => setFilter('forward')}
          >
            Forwards
          </Button>
        </div>
        
        {filteredPlayers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No players found with the selected position
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto pr-1">
            {filteredPlayers.slice(0, 5).map((player) => (
              <PlayerListItem key={player._id} player={player} />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewAllUsers}
        >
          View All Players
        </Button>
        <Button 
          size="sm"
          onClick={handleAddPlayer}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Player
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlayerManagement; 