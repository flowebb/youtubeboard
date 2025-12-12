import { Routes, Route, Navigate } from 'react-router-dom'
import { RegionProvider } from './contexts/RegionContext'
import Layout from './components/Layout'
import Ranking from './pages/Ranking'
import Insights from './pages/Insights'

function App() {
  return (
    <RegionProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/ranking" replace />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/insights" element={<Insights />} />
        </Routes>
      </Layout>
    </RegionProvider>
  )
}

export default App
