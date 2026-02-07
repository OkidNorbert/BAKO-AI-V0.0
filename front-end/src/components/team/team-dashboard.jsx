import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamStats from './team-stats';
import TeamDashboardChart from './team-dashboard-chart';
import RecentGames from './recent-games';
import PlayerManagement from './player-management';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Trophy, 
  Users, 
  Video,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import api from '../../utils/axiosConfig';

const TeamDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    gamesAnalyzed: 0,
    totalVideos: 0,
    winRate: 0,
    gamesPlayed: 0,
    trainingVideos: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [performanceAlerts, setPerformanceAlerts] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch team dashboard stats and general data
      const response = await api.get('/team/dashboard');
      const data = response.data;
      
      setStats(data.stats);
      setChartData(data.chartData);
      setRecentGames(data.recentGames);
      
      // Fetch performance alerts
      const alertsResponse = await api.get('/team/alerts');
      setPerformanceAlerts(alertsResponse.data.alerts || []);
    } catch (error) {
      console.error('Error fetching team dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExportReport = async () => {
    navigate('/team/reports');
  };

  // Navigation handlers
  const navigateToMatches = () => navigate('/team/matches');
  const navigateToRoster = () => navigate('/team/roster');
  const navigateToPlayers = () => navigate('/team/roster');
  const navigateToAnalytics = () => navigate('/team/analytics');
  const navigateToVideoUpload = () => navigate('/team/matches/upload');
  const navigateToSchedule = () => navigate('/team/schedule');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <TeamStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamDashboardChart data={chartData} />
        <Card>
          <CardHeader>
            <CardTitle>Team Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-24 bg-amber-50 hover:bg-amber-100 border-amber-200"
                onClick={navigateToMatches}
              >
                <div className="flex flex-col items-center">
                  <Video className="h-6 w-6 text-amber-500 mb-2" />
                  <span className="text-lg font-medium">Match Analysis</span>
                  <span className="text-xs text-muted-foreground">Analyze game videos</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 bg-green-50 hover:bg-green-100 border-green-200"
                onClick={navigateToRoster}
              >
                <div className="flex flex-col items-center">
                  <Users className="h-6 w-6 text-green-500 mb-2" />
                  <span className="text-lg font-medium">Team Roster</span>
                  <span className="text-xs text-muted-foreground">Manage player information</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 bg-blue-50 hover:bg-blue-100 border-blue-200"
                onClick={navigateToPlayers}
              >
                <div className="flex flex-col items-center">
                  <Trophy className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-lg font-medium">Player Stats</span>
                  <span className="text-xs text-muted-foreground">View player performance</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-24 bg-purple-50 hover:bg-purple-100 border-purple-200"
                onClick={navigateToAnalytics}
              >
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-6 w-6 text-purple-500 mb-2" />
                  <span className="text-lg font-medium">Analytics</span>
                  <span className="text-xs text-muted-foreground">View team statistics</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20"
                onClick={navigateToVideoUpload}
              >
                <div className="flex flex-col items-center">
                  <Video className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Upload Video</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-20"
                onClick={navigateToSchedule}
              >
                <div className="flex flex-col items-center">
                  <Calendar className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Schedule</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
        <RecentGames games={recentGames} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerManagement alerts={performanceAlerts} />
        {/* Additional team analytics component can be added here */}
      </div>
    </div>
  );
};

export default TeamDashboard; 