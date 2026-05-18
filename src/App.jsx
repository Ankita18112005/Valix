import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import CreateIdea from './pages/CreateIdea';
import IdeaDetail from './pages/IdeaDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

export default function App() {
  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message, { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
    } else if (type === 'error') {
      toast.error(message, { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
    } else {
      toast(message, { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
    }
  };

  return (
    <Router>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<Landing showToast={showToast} />} />
        <Route path="/login" element={<Login showToast={showToast} />} />
        <Route path="/signup" element={<Signup showToast={showToast} />} />
        <Route path="/home" element={<Home showToast={showToast} />} />
        <Route path="/create" element={<CreateIdea showToast={showToast} />} />
        <Route path="/idea/:id" element={<IdeaDetail showToast={showToast} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
