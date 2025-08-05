import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hub from './pages/Hub';
import Dashboard from './pages/Dashboard';
import MyDashboards from './pages/MyDashboards';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/:id" element={<Dashboard />} />
        <Route path="/my-dashboards" element={<MyDashboards />} />
      </Routes>
    </Router>
  );
}

export default App;