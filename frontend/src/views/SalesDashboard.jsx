import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, Percent, TrendingUp, ShoppingBag, Globe, Users } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function SalesDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/sales')
      .then((response) => {
        if (response.data && response.data.kpi) {
          setData(response.data)
        } else {
          setError('Format data dari backend tidak sesuai.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Gagal mengambil data sales:', err)
        setError('Gagal terhubung ke server backend Python. Pastikan Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
        <p>Sedang memproses data komersial dari database... Mohon tunggu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h3 style={{ marginBottom: '10px' }}>🚨 Error Terjadi</h3>
        <p>{error}</p>
      </div>
    )
  }

  const formatCurrency = (value) => {
    const num = Number(value) || 0
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {/* HEADER BARIS UTAMA */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>💰 Commercial & Sales Dashboard</h1>
        <p style={{ fontSize: '14px', color: 'var(--text)' }}>Monitor performa omset, batas margin keuntungan, wilayah pemasaran, dan struktur distributor.</p>
      </div>

      {/* ==========================================================
         BARIS 1: KPI SUMMARY CARDS
         ========================================================== */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <DollarSign size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Total Revenue</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{formatCurrency(data?.kpi?.total_revenue)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
            <ShoppingBag size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Total Cost (COGS)</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{formatCurrency(data?.kpi?.total_cost)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <TrendingUp size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Net Profit</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{formatCurrency(data?.kpi?.total_profit)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(170, 59, 255, 0.1)', borderRadius: '10px' }}>
            <Percent size={24} color="#aa3bff" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Profit Margin</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.profit_margin || 0}%</h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
         BARIS 2: GRAFIK CORE PERFORMA (SEASONALITY & PORTFOLIO)
         ========================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>📈 Monthly Sales Seasonality Trend</h3>
          <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <LineChart data={data?.seasonality_trend || []} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="EnglishMonthName" stroke="var(--text)" style={{ fontSize: '12px' }} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} stroke="var(--text)" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
                <Legend />
                <Line type="monotone" dataKey="SalesAmount" stroke="#38bdf8" strokeWidth={3} activeDot={{ r: 8 }} name="Omset Penjualan" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>📊 Product Category Portfolio Structure</h3>
          <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart data={data?.product_portfolio || []} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="EnglishProductCategoryName" stroke="var(--text)" style={{ fontSize: '12px' }} />
                <YAxis tickFormatter={(v) => `$${v / 1000000}M`} stroke="var(--text)" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Revenue" fill="#aa3bff" name="Total Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#22c55e" name="Net Profit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==========================================================
         BARIS 3: UNPACK ANALYSIS BARU (RESELLER & GEOGRAPHY COOPERATIONS)
         ========================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '25px' }}>
        {/* Kontribusi Kelas Distributor/Reseller */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Users size={18} color="#aa3bff" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>👥 Reseller Partner Tiering Contribution</h3>
          </div>
          <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <BarChart data={data?.reseller_tiering || []} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="Tier" stroke="var(--text)" style={{ fontSize: '12px' }} />
                <YAxis tickFormatter={(v) => `$${v / 1000000}M`} stroke="var(--text)" style={{ fontSize: '12px' }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="TotalSales" fill="#eab308" name="Kontribusi Penjualan" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Penjualan Antar Negara Terbesar */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <Globe size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>🌍 Global Geographic Sales Leaderboard</h3>
          </div>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-h)', fontWeight: 'bold' }}>
                  <th style={{ padding: '10px 6px' }}>Negara Wilayah</th>
                  <th style={{ padding: '10px 6px', textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ padding: '10px 6px', textAlign: 'right' }}>Avg Freight Cost</th>
                </tr>
              </thead>
              <tbody>
                {data?.geography_performance?.map((geo, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                    <td style={{ padding: '10px 6px', fontWeight: '500', color: 'var(--text-h)' }}>{geo.EnglishCountryRegionName}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: '600', color: '#22c55e' }}>{formatCurrency(geo.TotalSales)}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(geo.AvgFreight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==========================================================
         BARIS 4: DISCOUNT IMPACT MATRIX ANALYSIS
         ========================================================== */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>📉 Product Subcategory Discount & Margin Impact Matrix</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-h)', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Subkategori Produk</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Avg Discount Provided</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Gross Revenue</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Net Profit Generated</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Realized Margin</th>
            </tr>
          </thead>
          <tbody>
            {data?.discount_impact?.slice(0, 8).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--text-h)' }}>{item.EnglishProductSubcategoryName}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>{Number(item.AvgDiscountPct).toFixed(2)}%</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatCurrency(item.TotalRevenue)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#22c55e' }}>{formatCurrency(item.TotalProfit)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      backgroundColor: item.MarginPct > 5 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: item.MarginPct > 5 ? '#22c55e' : '#ef4444',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {Number(item.MarginPct).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
