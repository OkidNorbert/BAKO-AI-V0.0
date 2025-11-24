import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LiveAnalysis from './pages/LiveAnalysis';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live" element={<LiveAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;
