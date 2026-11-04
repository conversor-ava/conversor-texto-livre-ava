import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { EvaluationProvider } from './hooks/useEvaluation'
import { ExportPage } from './pages/ExportPage'
import { GeneratePage } from './pages/GeneratePage'
import { ReviewPage } from './pages/ReviewPage'

export default function App() {
  return (
    <BrowserRouter>
      <EvaluationProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<GeneratePage />} />
            <Route path="revisao" element={<ReviewPage />} />
            <Route path="exportacao" element={<ExportPage />} />
            <Route path="*" element={<GeneratePage />} />
          </Route>
        </Routes>
      </EvaluationProvider>
    </BrowserRouter>
  )
}