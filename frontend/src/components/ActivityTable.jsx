import React from 'react';
import '../css/Admin/ActivityTable.css';

const ActivityTable = () => {
  const data = [
    { teacher: 'Teacher Rodney', topic: 'Aralin 1: Ponetiko', status: 'Approved', color: '#f36' },
    { teacher: 'Teacher Rodney', topic: 'Aralin 2: Pagkilala sa salita', status: 'Approved', color: '#a8f' },
    { teacher: 'Teacher Rodney', topic: 'Aralin 3: Patinig', status: 'Approved', color: '#6ff' },
    { teacher: 'Teacher Rodney', topic: 'Aralin 1: Ponetiko', status: 'Approved', color: '#999' },
  ];

  return (
    <table className="activity-table">
      <thead>
        <tr>
          <th>Teacher Name</th>
          <th>Topic</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td><span className="dot" style={{ background: item.color }}></span>{item.teacher}</td>
            <td>{item.topic}</td>
            <td className="approved">{item.status}</td>
            <td className="link">View Details</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ActivityTable;
