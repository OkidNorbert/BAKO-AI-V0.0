import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamStats from './team-stats';
import TeamDashboardChart from './team-dashboard-chart';
import RecentActivities from './recent-activities';
import BudgetAlerts from './budget-alerts';
import IncidentReports from './incident-reports';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Download,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  UserCog,
  FileText,
  Users,
  CalendarClock
} from 'lucide-react';
import { useToast } from '../ui/use-toast';
import api from '../../utils/axiosConfig';

const TeamDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    attendanceRate: 0,
    incidentReports: 0,
    budgetAlerts: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats and general data
      const response = await api.get('/admin/dashboard');
      const data = response.data;

      setStats(data.stats);
      setChartData(data.chartData);
      setActivities(data.activities);

      // Fetch budget alerts
      const budgetAlertsResponse = await api.get('/admin/budgets/alerts');
      setBudgetAlerts(budgetAlertsResponse.data.alerts || []);

      // Fetch recent incidents
      const incidentsResponse = await api.get('/admin/incidents', {
        params: { status: 'open', limit: 5 }
      });
      setIncidents(incidentsResponse.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
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
    navigate('/team/export');
  };

  // Navigation handlers
  const navigateToIncidents = () => navigate('/team/incidents');
  const navigateToBudget = () => navigate('/team/budgets');
  const navigateToUsers = () => navigate('/team/users');
  const navigateToExport = () => navigate('/team/export');
  const navigateToAddPlayer = () => navigate('/team/players/new');
  const navigateToAttendance = () => navigate('/team/attendance');

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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

      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamDashboardChart data={chartData} />
        <Card>
          <CardHeader>
            <CardTitle>Admin Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 bg-amber-50 hover:bg-amber-100 border-amber-200"
                onClick={navigateToIncidents}
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mb-2" />
                  <span className="text-lg font-medium">Incident Management</span>
                  <span className="text-xs text-muted-foreground">Manage health & safety issues</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-green-50 hover:bg-green-100 border-green-200"
                onClick={navigateToBudget}
              >
                <div className="flex flex-col items-center">
                  <DollarSign className="h-6 w-6 text-green-500 mb-2" />
                  <span className="text-lg font-medium">Budget Management</span>
                  <span className="text-xs text-muted-foreground">Track and manage expenses</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-blue-50 hover:bg-blue-100 border-blue-200"
                onClick={navigateToUsers}
              >
                <div className="flex flex-col items-center">
                  <UserCog className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-lg font-medium">User Roles</span>
                  <span className="text-xs text-muted-foreground">Manage staff accounts</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24 bg-purple-50 hover:bg-purple-100 border-purple-200"
                onClick={navigateToExport}
              >
                <div className="flex flex-col items-center">
                  <FileText className="h-6 w-6 text-purple-500 mb-2" />
                  <span className="text-lg font-medium">Export Data</span>
                  <span className="text-xs text-muted-foreground">Generate PDF/CSV reports</span>
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
                onClick={navigateToAddPlayer}
              >
                <div className="flex flex-col items-center">
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Add Player</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={navigateToAttendance}
              >
                <div className="flex flex-col items-center">
                  <CalendarClock className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Attendance</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
        <RecentActivities activities={activities} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetAlerts alerts={budgetAlerts} />
        <IncidentReports incidents={incidents} />
      </div>
    </div>
  );
};

export default TeamDashboard; 