import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserCog, Shield, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getRoleBadgeClass = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'teacher':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'assistant':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'parent':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const RoleListItem = ({ user }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-gray-50">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.firstName} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-gray-600 font-medium">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </h4>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      <Badge className={getRoleBadgeClass(user.role)}>
        {user.role}
      </Badge>
    </div>
  );
};

const RoleManagement = ({ users = [] }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  
  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(user => user.role?.toLowerCase() === filter.toLowerCase());
  
  const handleAddUser = () => {
    navigate('/admin/users/new');
  };
  
  const handleViewAllUsers = () => {
    navigate('/admin/users');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <UserCog className="h-5 w-5 mr-2 text-blue-500" />
          User Role Management
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
            variant={filter === 'admin' ? 'default' : 'outline'} 
            onClick={() => setFilter('admin')}
          >
            <Shield className="h-4 w-4 mr-1" />
            Admins
          </Button>
          <Button 
            size="sm" 
            variant={filter === 'teacher' ? 'default' : 'outline'} 
            onClick={() => setFilter('teacher')}
          >
            Teachers
          </Button>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No users found with the selected role
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto pr-1">
            {filteredUsers.slice(0, 5).map((user) => (
              <RoleListItem key={user._id} user={user} />
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
          View All Users
        </Button>
        <Button 
          size="sm"
          onClick={handleAddUser}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoleManagement; 