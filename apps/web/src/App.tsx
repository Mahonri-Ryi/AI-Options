import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CalculatorPage } from './pages/CalculatorPage';
import { HomePage } from './pages/HomePage';
import { ToolPage } from './pages/ToolPage';
import { TrialProvider } from './hooks/useTrial';

export default function App() {
  return (
    <TrialProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calculator/:id" element={<CalculatorPage />} />
          <Route path="/tools/:id" element={<ToolPage />} />
        </Routes>
      </Layout>
    </TrialProvider>
  );
}
