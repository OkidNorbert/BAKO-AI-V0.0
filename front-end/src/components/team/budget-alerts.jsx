import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

const BudgetAlertItem = ({ alert }) => {
  const percentageSpent = parseFloat(alert.percentageSpent).toFixed(1);
  const isOverBudget = alert.isOverBudget;
  
  return (
    <div className={`p-3 rounded-lg mb-2 ${
      isOverBudget 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-start">
        <AlertCircle className={`h-5 w-5 mt-0.5 mr-2 ${
          isOverBudget ? 'text-red-500' : 'text-yellow-500'
        }`} />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {alert.budgetName} - {alert.categoryName}
          </h4>
          <div className="text-sm text-gray-600 mt-1">
            <div className="flex justify-between">
              <span>Allocated:</span>
              <span className="font-medium">${alert.allocatedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Spent:</span>
              <span className={`font-medium ${
                isOverBudget ? 'text-red-600' : 'text-yellow-600'
              }`}>
                ${alert.spentAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className={`font-medium ${
                isOverBudget ? 'text-red-600' : 'text-green-600'
              }`}>
                ${alert.remainingAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className={`h-2.5 rounded-full ${
                isOverBudget 
                  ? 'bg-red-500' 
                  : percentageSpent > 90 
                    ? 'bg-orange-500' 
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(percentageSpent, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-right mt-1 font-medium">
            {percentageSpent}% spent
          </div>
        </div>
      </div>
    </div>
  );
};

const BudgetAlerts = ({ alerts = [] }) => {
  const navigate = useNavigate();
  
  const handleViewAllAlerts = () => {
    navigate('/team/budgets?filter=alerts');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
          Budget Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No budget alerts at this time
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto pr-1">
            {alerts.slice(0, 3).map((alert, index) => (
              <BudgetAlertItem key={index} alert={alert} />
            ))}
            {alerts.length > 3 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                +{alerts.length - 3} more alerts
              </p>
            )}
          </div>
        )}
      </CardContent>
      {alerts.length > 0 && (
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleViewAllAlerts}
          >
            View All Alerts
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BudgetAlerts; 