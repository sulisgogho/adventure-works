import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Globe, Package, Map, Flag, TrendingUp } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function TerritoryDashboard() {
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/territory')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setGeoData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data Teritori Penjualan.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching Territory data:', err)
        setError('Gagal terhubung ke API Territory. Pastikan server Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Menghitung kontribusi omset berdasarkan koordinat regional dan benua pemasaran...</p>
      </div>
    )
  if (error)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h3>🚨 Error Terjadi</h3>
        <p>{error}</p>
      </div>
    )

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0)
  }
  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)

  // Palet warna estetik untuk diagram Donut wilayah global
  const COLORS = ['#38bdf8', '#aa3bff', '#eab308', '#ef4444', '#22c55e']

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>🌐 International Sales & Territory Expansion Tower</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Analisis pemetaan geografi makro ekonomi terhadap total perolehan omset dan volume unit ekspor barang.</p>
      </div>

      {/* ==========================================================
         A. KPI GRID SECTION
         ========================================================== */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <TrendingUp size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Global Gross Revenue</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(geoData?.kpi?.total_global_revenue)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(170, 59, 255, 0.1)', borderRadius: '10px' }}>
            <Package size={24} color="#aa3bff" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Global Shipped Volume</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatNumber(geoData?.kpi?.total_items_shipped)} Pcs</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <Flag size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Active State Entities</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#22c55e' }}>{geoData?.kpi?.active_countries} Negara</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <Map size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Operational Regions</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{geoData?.kpi?.active_regions} Teritori</h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
         B. VISUALISASI CHARTS SECTION
         ========================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        {/* Diagram Donat: Kontribusi Makro Group (North America, Europe, Pacific) */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifycontent: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#f8fafc' }}>🍩 Macro Continental Market Share</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={geoData?.group_performance || []} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="Value" nameKey="TerritoryGroup">
                  {geoData?.group_performance?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagram Batang: Peringkat Omset per Negara */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Globe size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📊 Revenue Generation Rank by Sovereign Country</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={geoData?.country_performance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="TerritoryCountry" stroke="var(--text)" style={{ fontSize: '11px' }} />
              <YAxis tickFormatter={(v) => `$${v / 1e6}M`} stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="TotalRevenue" fill="#38bdf8" name="Revenue Outflow ($)" radius={[4, 4, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================================
         C. DETAILED TERRITORY LEDGER TABLE
         ========================================================== */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#f8fafc' }}>📋 Sovereign Market Performance Matrix</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Nama Negara Berdaulat</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Volume Distribusi Barang (Pcs)</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Kumulatif Gross Revenue ($)</th>
            </tr>
          </thead>
          <tbody>
            {geoData?.country_performance?.map((country, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>{country.TerritoryCountry}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#aa3bff', fontWeight: '600' }}>{formatNumber(country.VolumeOrder)} Units</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#38bdf8', fontWeight: '600' }}>{formatCurrency(country.TotalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
