import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'low':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'injury':
      return '🩹';
    case 'behavioral':
      return '😮';
    case 'illness':
      return '🤒';
    case 'safety':
      return '⚠️';
    default:
      return '📝';
  }
};

const IncidentReportItem = ({ incident }) => {
  return (
    <div className="p-3 border rounded-lg mb-2 hover:bg-gray-50">
      <div className="flex items-start">
        <div className="text-xl mr-3">{getTypeIcon(incident.type)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              {incident.student ? `${incident.student.firstName} ${incident.student.lastName}` : 'Unknown'}
            </h4>
            <Badge className={getSeverityColor(incident.severity)}>
              {incident.severity}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {incident.description}
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(incident.createdAt), 'PP')}
            <span className="mx-2">•</span>
            {incident.reportedBy ? `Reported by ${incident.reportedBy.firstName}` : 'Staff'}
          </div>
        </div>
      </div>
    </div>
  );
};

const IncidentReports = ({ incidents = [] }) => {
  const navigate = useNavigate();
  
  const handleViewAllIncidents = () => {
    navigate('/team/incidents');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
          Recent Incidents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No recent incidents to display
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto pr-1">
            {incidents.map((incident) => (
              <IncidentReportItem key={incident._id} incident={incident} />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleViewAllIncidents}
        >
          View All Incidents
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IncidentReports; 