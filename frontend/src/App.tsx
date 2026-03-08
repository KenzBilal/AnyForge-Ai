import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';

// Placeholder Pages
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Playground from './pages/Playground';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/History';
import Docs from './pages/Docs';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route element={<Layout />}>
          <Route path="/playground" element={<Playground />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/docs" element={<Docs />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
