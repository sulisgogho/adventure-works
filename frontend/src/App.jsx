import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import SalesDashboard from './views/SalesDashboard'
import LogisticsDashboard from './views/LogisticsDashboard'
import PpicDashboard from './views/PpicDashboard'
import B2CDashboard from './views/B2CDashboard'
import CallCenterDashboard from './views/CallCenterDashboard'
import SentimentDashboard from './views/SentimentDashboard'
import FinanceDashboard from './views/FinanceDashboard'
import HrDashboard from './views/HrDashboard'
import TerritoryDashboard from './views/TerritoryDashboard'
import PromotionDashboard from './views/PromotionDashboard'
import './App.css'

export default function App() {
  // State utama untuk mengontrol halaman mana yang sedang aktif
  const [currentView, setCurrentView] = useState('sales')

  // Fungsi untuk merender halaman berdasarkan state currentView
  const renderView = () => {
    switch (currentView) {
      case 'sales':
        return <SalesDashboard />
      case 'logistics':
        return <LogisticsDashboard />
      case 'ppic':
        return <PpicDashboard />
      case 'b2c':
        return <B2CDashboard />
      default:
        return <SalesDashboard />
      case 'callcenter':
        return <CallCenterDashboard />
      case 'sentiment':
        return <SentimentDashboard />
      case 'finance':
        return <FinanceDashboard />
      case 'hr':
        return <HrDashboard />
      case 'territory':
        return <TerritoryDashboard />
      case 'promotion':
        return <PromotionDashboard />
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg)' /* BERUBAH: Mengikuti tema background global */,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Komponen Navigasi Kiri */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      {/* Konten Utama Kanan */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div
          style={{
            backgroundColor: 'var(--card-bg)' /* BERUBAH: Mengikuti tema box kartu dashboard */,
            padding: '30px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow)',
            minHeight: '80vh',
          }}
        >
          {renderView()}
        </div>
      </main>
    </div>
  )
}
