import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CalculatorPage } from './pages/CalculatorPage';
import { HomePage } from './pages/HomePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculator/:id" element={<CalculatorPage />} />
      </Routes>
    </Layout>
  );
}
