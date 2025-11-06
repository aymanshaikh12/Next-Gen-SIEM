import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import UploadLogs from './pages/UploadLogs';
import SOAR from './pages/SOAR';
import Events from './pages/Events';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/events" element={<Events />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/upload" element={<UploadLogs />} />
          <Route path="/soar" element={<SOAR />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
