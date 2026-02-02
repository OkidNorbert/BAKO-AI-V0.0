import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Users, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  DollarSign,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { DatePicker } from "../../components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { useToast } from "../../components/ui/use-toast";
import { useForm } from "react-hook-form";
import { format } from 'date-fns';

const ExportData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exportType, setExportType] = useState('pdf');
  const [exportCategory, setExportCategory] = useState('payments');
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    defaultValues: {
      startDate: null,
      endDate: null,
      status: "",
      fiscalYear: new Date().getFullYear(),
      type: "",
      severity: "",
    }
  });
  
  const handleExport = async (values) => {
    setIsLoading(true);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (values.startDate) {
        queryParams.append('startDate', format(values.startDate, 'yyyy-MM-dd'));
      }
      
      if (values.endDate) {
        queryParams.append('endDate', format(values.endDate, 'yyyy-MM-dd'));
      }
      
      if (values.status) {
        queryParams.append('status', values.status);
      }
      
      if (values.fiscalYear) {
        queryParams.append('fiscalYear', values.fiscalYear);
      }
      
      if (values.type) {
        queryParams.append('type', values.type);
      }
      
      if (values.severity) {
        queryParams.append('severity', values.severity);
      }
      
      // Construct URL
      const url = `/api/admin/export/${exportCategory}/${exportType}?${queryParams.toString()}`;
      
      // Make the request
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to export ${exportCategory} data`);
      }
      
      // Handle the response based on export type
      if (exportType === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportCategory}_export_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportCategory}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast({
        title: "Export Successful",
        description: `Successfully exported ${exportCategory} data as ${exportType.toUpperCase()}`,
      });
    } catch (error) {
      console.error(`Error exporting ${exportCategory} data:`, error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getExportIcon = (category) => {
    switch (category) {
      case 'payments':
        return <CreditCard className="h-5 w-5" />;
      case 'attendance':
        return <Calendar className="h-5 w-5" />;
      case 'children':
        return <Users className="h-5 w-5" />;
      case 'incidents':
        return <AlertTriangle className="h-5 w-5" />;
      case 'budgets':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  const getFormatOptions = () => {
    return (
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant={exportType === 'pdf' ? 'default' : 'outline'}
          onClick={() => setExportType('pdf')}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </Button>
        <Button
          type="button"
          variant={exportType === 'csv' ? 'default' : 'outline'}
          onClick={() => setExportType('csv')}
          className="flex-1"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>
    );
  };
  
  const getCategorySpecificFields = () => {
    switch (exportCategory) {
      case 'payments':
        return (
          <>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={isLoading}
                    placeholder="Select start date"
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={isLoading}
                    placeholder="Select end date"
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </>
        );
        
      case 'attendance':
        return (
          <>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={isLoading}
                    placeholder="Select start date"
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={isLoading}
                    placeholder="Select end date"
                  />
                </FormItem>
              )}
            />
          </>
        );
        
      case 'incidents':
        return (
          <>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={isLoading}
                    placeholder="Select start date"
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <DatePicker
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={isLoading}
                    placeholder="Select end date"
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="illness">Illness</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All severities" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </>
        );
        
      case 'budgets':
        return (
          <>
            <FormField
              control={form.control}
              name="fiscalYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Year</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiscal year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Status</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Export Data</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Data Categories</CardTitle>
              <CardDescription>
                Select which data you want to export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={exportCategory === 'payments' ? 'default' : 'outline'}
                  onClick={() => setExportCategory('payments')}
                  className="w-full justify-start"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payments
                </Button>
                <Button
                  type="button"
                  variant={exportCategory === 'attendance' ? 'default' : 'outline'}
                  onClick={() => setExportCategory('attendance')}
                  className="w-full justify-start"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Attendance
                </Button>
                <Button
                  type="button"
                  variant={exportCategory === 'children' ? 'default' : 'outline'}
                  onClick={() => setExportCategory('children')}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Children
                </Button>
                <Button
                  type="button"
                  variant={exportCategory === 'incidents' ? 'default' : 'outline'}
                  onClick={() => setExportCategory('incidents')}
                  className="w-full justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Incidents
                </Button>
                <Button
                  type="button"
                  variant={exportCategory === 'budgets' ? 'default' : 'outline'}
                  onClick={() => setExportCategory('budgets')}
                  className="w-full justify-start"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budgets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getExportIcon(exportCategory)}
                <span className="ml-2">
                  Export {exportCategory.charAt(0).toUpperCase() + exportCategory.slice(1)}
                </span>
              </CardTitle>
              <CardDescription>
                Configure export options and filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleExport)} className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-2">Export Format</h3>
                    {getFormatOptions()}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="flex items-center text-sm font-medium">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getCategorySpecificFields()}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Exporting...
                        </div>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export as {exportType.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportData; 