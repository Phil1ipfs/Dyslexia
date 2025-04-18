// src/pages/Admin/VisualChartsPage.jsx
import React, { useState } from 'react';
import {
  ActivityCompletionChart,
  WeeklyApprovalChart,
  UserRegistrationChart,
  UserTypeChart,
  UserStatusChart,
  ChartCard
} from '../../components/Charts';
import useChartData from '../../hooks/useChartData';
import {
  fetchActivityCompletionData,
  fetchWeeklyApprovalRateData,
  fetchUserRegistrationTrendData,
  fetchUserTypeData,
  fetchUserStatusData
} from '../../services/chartDataService';

import "../../components/Admin/Dashboard/VisualChartsPage.css";

const VisualChartsPage = () => {
  // Use our custom hook to fetch each chart's data
  const activityChart = useChartData(fetchActivityCompletionData);
  const approvalRateChart = useChartData(fetchWeeklyApprovalRateData);
  const registrationTrendChart = useChartData(fetchUserRegistrationTrendData);
  const userTypeChart = useChartData(fetchUserTypeData);
  const userStatusChart = useChartData(fetchUserStatusData);

  // Determine if any charts are still loading
  const isLoading = 
    activityChart.loading || 
    approvalRateChart.loading || 
    registrationTrendChart.loading || 
    userTypeChart.loading || 
    userStatusChart.loading;

  // Determine if any charts had an error
  const hasError = 
    activityChart.error || 
    approvalRateChart.error || 
    registrationTrendChart.error || 
    userTypeChart.error || 
    userStatusChart.error;

  if (isLoading) {
    return <div className="loading-spinner">Loading charts...</div>;
  }

  if (hasError) {
    return (
      <div className="error-message">
        Failed to load chart data. Please try again later.
      </div>
    );
  }

  return (
    <div className="visual-charts-page">
      <h1 className="page-title">Visual Charts</h1>
      
      {/* Top row for the first two charts */}
      <div className="top-charts-row">
        <div className="chart-container">
          <ChartCard 
            title="Activity Completion (Last 6 Weeks)"
            chartType="bar"
          >
            {activityChart.data && <ActivityCompletionChart data={activityChart.data} />}
          </ChartCard>
        </div>
        
        <div className="chart-container">
          <ChartCard 
            title="Weekly Approval Rate (%)" 
            chartType="line"
          >
            {approvalRateChart.data && <WeeklyApprovalChart data={approvalRateChart.data} />}
          </ChartCard>
        </div>
      </div>
      
      {/* Bottom row for the three charts */}
      <div className="bottom-charts-row">
        <div className="chart-container">
          <ChartCard 
            title="User Registration Trend" 
            chartType="bar"
          >
            {registrationTrendChart.data && <UserRegistrationChart data={registrationTrendChart.data} />}
          </ChartCard>
        </div>
        
        <div className="chart-container">
          <ChartCard 
            title="User Type" 
            chartType="pie"
          >
            {userTypeChart.data && <UserTypeChart data={userTypeChart.data} />}
          </ChartCard>
        </div>
        
        <div className="chart-container">
          <ChartCard 
            title="User Status" 
            chartType="pie"
          >
            {userStatusChart.data && <UserStatusChart data={userStatusChart.data} />}
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default VisualChartsPage;