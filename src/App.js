import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import LeaveManagement from './pages/LeaveManagement';
import Profile from './pages/Profile';
import Register from './pages/Register';
import LeaveRequest from './pages/LeaveRequest';
import LeaveHistory from './pages/LeaveHistory';
import Header from './components/header';
import './styles.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/leaves" element={<LeaveManagement />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leave-request" element={<LeaveRequest />} />
          <Route path="/leave-history" element={<LeaveHistory />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;