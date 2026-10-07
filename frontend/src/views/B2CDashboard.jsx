import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ShoppingBag, TrendingUp, Percent, CreditCard, Users, Gift } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function B2CDashboard() {
  const [b2cData, setB2cData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/b2c')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setB2cData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data B2C.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching B2C data:', err)
        setError('Gagal terhubung ke API Backend B2C. Pastikan server Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Mengkalkulasi demografi pelanggan dan omset retail e-commerce...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h3>🚨 Error Terjadi</h3>
        <p>{error}</p>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA3BFF']

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>🛒 E-Commerce Retail (B2C) Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Analisis performa penjualan online langsung ke konsumen, demografi ekonomi pelanggan, dan performa promosi.</p>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <ShoppingBag size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>B2C Revenue</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(b2cData?.kpi?.total_revenue)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <TrendingUp size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Net Profit</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(b2cData?.kpi?.total_profit)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(170, 59, 255, 0.1)', borderRadius: '10px' }}>
            <Percent size={24} color="#aa3bff" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Profit Margin</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{b2cData?.kpi?.profit_margin}%</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <CreditCard size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Avg Order Value (AOV)</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(b2cData?.kpi?.avg_order_value)}</h3>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#f8fafc' }}>📈 Monthly E-Commerce Revenue Growth</h3>
          <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={280} minWidth={0}>
              <BarChart data={b2cData?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="EnglishMonthName" stroke="var(--text)" style={{ fontSize: '12px' }} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} stroke="var(--text)" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Revenue" fill="#38bdf8" name="Revenue Online" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Users size={18} color="#aa3bff" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📊 Customer Share by Yearly Income Group</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '250px' }}>
            <div style={{ width: '50%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={b2cData?.demographic_income || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="TotalSales">
                    {b2cData?.demographic_income?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'left' }}>
              {b2cData?.demographic_income?.map((entry, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: COLORS[index % COLORS.length], borderRadius: '2px' }}></div>
                  <span>
                    {entry.IncomeGroup}: <strong style={{ color: '#f8fafc' }}>{formatCurrency(entry.TotalSales)}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABLE PROMOTION */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Gift size={18} color="#22c55e" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>🎁 Top 5 Marketing Promotion Campaign Effectiveness</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Nama Kampanye Promo</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Sales Generated</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Discount Burnt</th>
            </tr>
          </thead>
          <tbody>
            {b2cData?.promo_performance?.map((promo, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>{promo.EnglishPromotionName}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#22c55e', fontWeight: '600' }}>{formatCurrency(promo.TotalSales)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ef4444' }}>{formatCurrency(promo.DiscountApplied)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
