// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// // import Homepage from './pages/Homepage.jsx';
// // import ViewStudent from './pages/ViewStudent.jsx';

// import Sidebar from './widgets/Sidebar.jsx'; 


// import './assets/fonts/fonts.css';

// // in App.jsx or index.jsx
// import "./css/Homepage/responsive.css";



// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         {/* <Route path="/" element={<Homepage />} /> */}
        
//         <Route path="/" element={<Sidebar/>} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;



import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ViewStudent from './pages/ViewStudent.jsx';
import Sidebar from './widgets/Sidebar.jsx'; 
import './assets/fonts/fonts.css';

function App() {
  return (
    <BrowserRouter>
      
        {/* Sidebar fixed on the left */}
        <Sidebar active="student" />

        {/* Main content area; margin-left should match sidebar width */}
        <div style={{ marginLeft: '290px', padding: '1rem', flex: 1 }}>
          <Routes>
            <Route path="/view-student" element={<ViewStudent />} />
            <Route path="*" element={<Navigate to="/view-student" />} />
          </Routes>
        </div>
    </BrowserRouter>
  );
}

export default App;

