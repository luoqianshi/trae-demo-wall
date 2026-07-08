import { Routes, Route, Navigate } from 'react-router-dom'
import MobileLayout from './layouts/MobileLayout'
import AdminLayout from './layouts/AdminLayout'

import Home from './pages/mobile/Home'
import Detail from './pages/mobile/Detail'
import Cert from './pages/mobile/Cert'
import Contest from './pages/mobile/Contest'
import Mutual from './pages/mobile/Mutual'
import Upload from './pages/mobile/Upload'
import Mine from './pages/mobile/Mine'
import Favorites from './pages/mobile/Favorites'
import MyUploads from './pages/mobile/MyUploads'
import Guide from './pages/mobile/Guide'

import Dashboard from './pages/admin/Dashboard'
import Activities from './pages/admin/Activities'
import Review from './pages/admin/Review'
import TrustRules from './pages/admin/TrustRules'
import PushConfig from './pages/admin/PushConfig'
import Uploads from './pages/admin/Uploads'
import RiskLogs from './pages/admin/RiskLogs'
import MutualReview from './pages/admin/MutualReview'

export default function App() {
  return (
    <Routes>
      <Route path="/app" element={<MobileLayout />}>
        <Route index element={<Home />} />
        <Route path="detail/:id" element={<Detail />} />
        <Route path="cert" element={<Cert />} />
        <Route path="contest" element={<Contest />} />
        <Route path="mutual" element={<Mutual />} />
        <Route path="upload" element={<Upload />} />
        <Route path="mine" element={<Mine />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="my-uploads" element={<MyUploads />} />
        <Route path="guide" element={<Guide />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="activities" element={<Activities />} />
        <Route path="review" element={<Review />} />
        <Route path="trust-rules" element={<TrustRules />} />
        <Route path="push-config" element={<PushConfig />} />
        <Route path="uploads" element={<Uploads />} />
        <Route path="risk-logs" element={<RiskLogs />} />
        <Route path="mutual" element={<MutualReview />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
