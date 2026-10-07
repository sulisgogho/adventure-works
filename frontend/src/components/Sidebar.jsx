import React from 'react'
// Kita tambahkan icon ShoppingCart di sini untuk menu B2C
import { TrendingUp, Truck, Boxes, BarChart3, ShoppingCart, Headphones, HeartHandshake, Landmark, Users, Globe, Megaphone } from 'lucide-react'

export default function Sidebar({ currentView, setCurrentView }) {
  const menuItems = [
    { id: 'sales', name: 'Sales Performance', icon: TrendingUp },
    { id: 'b2c', name: 'E-Commerce Retail (B2C)', icon: ShoppingCart }, // <-- Menu Baru disisipkan di sini
    { id: 'logistics', name: 'Logistics & Supply Chain', icon: Truck },
    { id: 'ppic', name: 'PPIC & Inventory', icon: Boxes },
    { id: 'callcenter', name: 'Customer Call Center', icon: Headphones },
    { id: 'sentiment', name: 'Market Research & CSAT', icon: HeartHandshake },
    { id: 'finance', name: 'Corporate Finance Tower', icon: Landmark },
    { id: 'hr', name: 'Human Capital Performance', icon: Users },
    { id: 'territory', name: 'Global Sales & Territory', icon: Globe },
    { id: 'promotion', name: 'Marketing & Campaign Impact', icon: Megaphone },
  ]

  return (
    <div
      style={{
        width: '260px',
        backgroundColor: '#1e293b',
        color: '#fff',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
      }}
    >
      {/* Header Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
        <BarChart3 size={28} color="#38bdf8" />
        <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AW Control Tower</span>
      </div>

      {/* Menu List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#38bdf8' : 'transparent',
                color: isActive ? '#0f172a' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease',
              }}
              // Efek hover sederhana agar navigasi terasa interaktif
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.05)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
            >
              <IconComponent size={20} />
              {item.name}
            </button>
          )
        })}
      </nav>

      {/* Footer User Info */}
      <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #334155' }}>Role: Enterprise Analyst</div>
    </div>
  )
}
