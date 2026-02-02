import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { ThemeProvider } from '../../../context/ThemeContext';
import DailyTransactionSummary from '../DailyTransactionSummary';
import FinancialTrendsChart from '../FinancialTrendsChart';

// Mock the dependencies
jest.mock('axios');
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
  Bar: () => <div data-testid="bar-chart" />,
  Pie: () => <div data-testid="pie-chart" />
}));
jest.mock('chart.js');
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn()
}));

// Mock ThemeContext
const mockThemeContext = {
  isDarkMode: false,
  toggleTheme: jest.fn()
};

// Helper function to wrap components with ThemeProvider
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider value={mockThemeContext}>
      {component}
    </ThemeProvider>
  );
};

describe('Financial Reporting Components', () => {
  describe('DailyTransactionSummary', () => {
    beforeEach(() => {
      // Mock API response
      axios.get.mockResolvedValue({
        data: {
          summaries: [
            {
              id: '1',
              date: '2023-05-01',
              totalRevenue: 1000,
              totalExpenses: 500,
              netBalance: 500,
              transactionCount: 10,
              revenueByCategory: {
                'credit_card': 600,
                'cash': 400
              },
              expenseByCategory: {
                'salary': 300,
                'supplies': 200
              }
            }
          ],
          periodSummary: {
            totalRevenue: 1000,
            totalExpenses: 500,
            netBalance: 500,
            days: 1
          }
        }
      });
      
      axios.post.mockResolvedValue({
        data: {
          message: 'Daily transaction summary generated successfully',
          summary: {
            id: '2',
            date: '2023-05-02',
            totalRevenue: 1200,
            totalExpenses: 600,
            netBalance: 600
          }
        }
      });
    });
    
    test('renders the component', async () => {
      renderWithTheme(<DailyTransactionSummary />);
      
      // Check for initial loading
      expect(screen.getByText('Loading summaries...')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Daily Transaction Summaries')).toBeInTheDocument();
      });
      
      // Check for summary info
      expect(screen.getByText('View summaries of all financial transactions on a daily basis')).toBeInTheDocument();
    });
    
    test('fetches and displays data', async () => {
      renderWithTheme(<DailyTransactionSummary />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      // Check summary data
      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Total Expenses')).toBeInTheDocument();
        expect(screen.getByText('Net Balance')).toBeInTheDocument();
      });
    });
    
    test('handles date range filter', async () => {
      renderWithTheme(<DailyTransactionSummary />);
      
      await waitFor(() => {
        expect(screen.getByText('Start Date')).toBeInTheDocument();
      });
      
      // Change date range
      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');
      
      fireEvent.change(startDateInput, { target: { value: '2023-05-01' } });
      fireEvent.change(endDateInput, { target: { value: '2023-05-31' } });
      
      // Click filter button
      const filterButton = screen.getByText('Filter');
      fireEvent.click(filterButton);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('startDate=2023-05-01&endDate=2023-05-31')
        );
      });
    });
    
    test('generates today\'s summary', async () => {
      renderWithTheme(<DailyTransactionSummary />);
      
      await waitFor(() => {
        expect(screen.getByText('Generate Today\'s Summary')).toBeInTheDocument();
      });
      
      // Click generate button
      const generateButton = screen.getByText('Generate Today\'s Summary');
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });
  });
  
  describe('FinancialTrendsChart', () => {
    const mockData = {
      monthly: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Revenue',
            data: [1000, 1200, 1100],
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgb(34, 197, 94)'
          },
          {
            label: 'Expenses',
            data: [800, 850, 900],
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgb(239, 68, 68)'
          },
          {
            label: 'Net Profit',
            data: [200, 350, 200],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)'
          }
        ]
      },
      expenseCategories: [
        { category: 'salary', amount: 1200 },
        { category: 'supplies', amount: 800 },
        { category: 'utilities', amount: 550 }
      ]
    };
    
    const onRefreshMock = jest.fn();
    
    test('renders the component with line chart by default', () => {
      renderWithTheme(
        <FinancialTrendsChart 
          data={mockData} 
          period="monthly" 
          onRefresh={onRefreshMock} 
        />
      );
      
      expect(screen.getByText('Financial Trends')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
    
    test('switches between chart types', () => {
      renderWithTheme(
        <FinancialTrendsChart 
          data={mockData} 
          period="monthly" 
          onRefresh={onRefreshMock} 
        />
      );
      
      // Test switching to bar chart
      const barButton = screen.getByText('Bar');
      fireEvent.click(barButton);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      
      // Test switching to pie/summary chart
      const summaryButton = screen.getByText('Summary');
      fireEvent.click(summaryButton);
      expect(screen.getAllByTestId('pie-chart')[0]).toBeInTheDocument();
      
      // Switch back to line chart
      const lineButton = screen.getByText('Line');
      fireEvent.click(lineButton);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
    
    test('handles refresh action', () => {
      renderWithTheme(
        <FinancialTrendsChart 
          data={mockData} 
          period="monthly" 
          onRefresh={onRefreshMock} 
        />
      );
      
      // Find and click the refresh button
      const refreshButton = screen.getByTitle('Refresh data');
      fireEvent.click(refreshButton);
      
      expect(onRefreshMock).toHaveBeenCalled();
    });
    
    test('displays no data message when data is missing', () => {
      renderWithTheme(
        <FinancialTrendsChart 
          data={null} 
          period="monthly" 
          onRefresh={onRefreshMock} 
        />
      );
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
}); 