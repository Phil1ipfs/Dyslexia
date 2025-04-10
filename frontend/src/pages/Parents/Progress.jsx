import React, { useState } from "react";
import "../../css/Parents/Progress.css";
import studentAvatar from "../../assets/images/Parents/student1.jpg"; // Update if needed

// Importing icons for each week
import week1Icon from "../../assets/images/Parents/word.png"; // Icon for Week 1
import week2Icon from "../../assets/images/Parents/phonics.png"; // Icon for Week 2
import week3Icon from "../../assets/images/Parents/word.png"; // Icon for Week 3
import week4Icon from "../../assets/images/Parents/phonics.png"; // Icon for Week 4

// Importing necessary components for Chart.js
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,  Title, Tooltip, Legend);

const Progress = () => {
  const [isDetailsVisible, setIsDetailsVisible] = useState(null); // State to toggle details visibility
  const [progressData] = useState([
    {
      week: 1,
      progress: 60,
      level: "Beginner",
      icon: week1Icon,  // Assign icon to the week
      details: [
        "Score: 85/100",
        "Time spent: 50 minutes",
        "Activity: Reading 'A-Z'",
        "Strength: Vocabulary recognition",
        "Weakness: Speed of reading"
      ]
    },
    {
      week: 2,
      progress: 70,
      level: "Beginner",
      icon: week2Icon,  // Assign icon to the week
      details: [
        "Score: 90/100",
        "Time spent: 45 mins",
        "Activity: Reading 'A-Z'",
        "Strength: Vocabulary recall",
        "Weakness: Sentence construction"
      ]
    },
    {
      week: 3,
      progress: 80,
      level: "Intermediate",
      icon: week3Icon,  // Assign icon to the week
      details: [
        "Score: 75/100",
        "Time spent: 1 hour",
        "Activity: Word Formation",
        "Strength: Word recognition",
        "Weakness: Spelling"
      ]
    },
    {
      week: 4,
      progress: 30,
      level: "Beginner",
      icon: week4Icon,  // Assign icon to the week
      details: [
        "Score: 50/100 (50%)",
        "Time spent: 55 minutes",
        "Activity: Word Recognition",
        "Strength: Basic word recall",
        "Weakness: Speed and fluency"
      ]
    }
  ]);

  const toggleDetails = (week) => {
    setIsDetailsVisible((prevState) => (prevState === week ? null : week));
  };

  // Data for the Bar Chart
  const chartData = {
    labels: progressData.map((data) => `Week ${data.week}`),
    datasets: [
      {
        label: 'Overall Progress',
        data: progressData.map((data) => data.progress),
        backgroundColor: '#10B981',  // Green color for progress bars
        borderColor: '#3b4f81',
        borderWidth: 2,
        barThickness: 50,  // Wider bars for a better visual impact
        hoverBackgroundColor: '#388E3C',  // Hover effect color
        hoverBorderColor: '#2C6B36',  // Border color on hover
        hoverBorderWidth: 2,
      },
    ],
  };

  // Bar Chart Options for Customizing Text and Other Styles
  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Student Progress Overview', // Title for the chart
        font: {
          size: 18,
          family: 'Arial', // Font family
          weight: 'bold', // Font weight
        },
        color: '#ffffff', // Title color (white)
      },
      legend: {
        labels: {
          color: '#ffffff', // Legend text color (white)
          font: {
            size: 14, // Adjust the font size of legend labels
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100, // Set the max scale value to 100
        grid: {
          color: 'rgba(255, 255, 255, 0.3)', // Lighter grid lines for readability
        },
        ticks: {
          color: '#ffffff', // Y-axis tick color (white)
          font: {
            size: 14, // Y-axis tick size
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.3)', // Lighter grid lines for readability
        },
        ticks: {
          color: '#ffffff', // X-axis tick color (white)
          font: {
            size: 14, // X-axis tick size
          },
        },
      },
    },
  };

  const monthlySummary = {
    totalProgress: progressData.reduce((acc, data) => acc + data.progress, 0) / progressData.length,
    strengths: "Vocabulary recall, Word formation",
    weaknesses: "Sentence construction, Fluency",
  };

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h1>Student Progress</h1>
      </div>

      <div className="monthly-summary-card">
        <div className="summary-info">
          <h2>Monthly Summary</h2>
          <p><strong>Total Progress:</strong> {monthlySummary.totalProgress}%</p>
          <p><strong>Strengths:</strong> {monthlySummary.strengths}</p>
          <p><strong>Weaknesses:</strong> {monthlySummary.weaknesses}</p>
        </div>

        <div className="student-info">
          <h2>Student Information</h2>
          <div className="student-info-details">
            <img
              src={studentAvatar}
              alt="Student Avatar"
              className="student-avatar"
            />
            <div>
              <p>Charles Ashley P. Santiago</p>
              <p>Student ID: 2022-54321</p>
              <p>Reading Level: Beginner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="progress-cards">
        {progressData.map((data, index) => (
          <div key={index} className="progress-card">
            <div className="week-icon">
              <img src={data.icon} alt={`Week ${data.week} Icon`} className="week-icon-img" />
            </div>
            <h3>Week {data.week}</h3>
            <p>Student ID: 2022-54321</p>
            <p>Reading Level: {data.level}</p>
            <div className="progress-bar">
              <div
                className="progress-bar-filled"
                style={{ width: `${data.progress}%` }}
              ></div>
            </div>
            <p>Overall Progress: {data.progress}%</p>
            <button onClick={() => toggleDetails(data.week)}>
              {isDetailsVisible === data.week ? "Hide Details" : "View Details"}
            </button>

            {isDetailsVisible === data.week && (
              <div className="week-details">
                <h4>Details for Week {data.week}</h4>
                <ul>
                  {data.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Progress;
