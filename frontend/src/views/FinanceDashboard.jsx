import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Wallet, Landmark, ArrowUpRight, Scale, Activity } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function FinanceDashboard() {
  const [finData, setFinData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/finance')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setFinData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data Finansial.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching Finance data:', err)
        setError('Gagal terhubung ke API Keuangan. Pastikan server Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Menyusun laporan neraca pengeluaran dan variansi anggaran korporat...</p>
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

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>🏛️ Corporate Finance & Budget Control Tower</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laporan analisis pengeluaran riil korporat vs target anggaran belanja tahunan perusahaan.</p>
      </div>

      {/* ==========================================================
         A. KPI GRID SECTION
         ========================================================== */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
            <Wallet size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Actual Expenditure</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(finData?.kpi?.actual_expenditure)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <Landmark size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Budget Allocation</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(finData?.kpi?.budget_plan)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <ArrowUpRight size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Budget Variance (Savings)</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#22c55e' }}>{formatCurrency(finData?.kpi?.budget_variance)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <Activity size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Budget Absorption Rate</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{finData?.kpi?.absorption_rate}%</h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
         B. VISUALISASI CHARTS SECTION
         ========================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        {/* Grafik Garis Tren Bulanan Pengeluaran Aktual */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#f8fafc' }}>📈 Actual Monthly Expenditure Flow</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={finData?.monthly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="EnglishMonthName" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis tickFormatter={(v) => `$${v / 1e6}M`} stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="TotalActual" stroke="#ef4444" strokeWidth={3} name="Actual Cash Out" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grafik Batang Perbandingan Skenario Finansial */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Scale size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📊 Financial Scenario Comparison</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={finData?.scenario_performance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="ScenarioName" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis tickFormatter={(v) => `$${v / 1e6}M`} stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="TotalAmount" fill="#38bdf8" name="Total Capital Demand" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================================
         C. DETAILED SCENARIO TABLE MATRIX
         ========================================================== */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#f8fafc' }}>📋 Corporate Budget Execution Report</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Tipe Skenario Finansial</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Penggunaan Dana Korporat</th>
            </tr>
          </thead>
          <tbody>
            {finData?.scenario_performance?.map((scen, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>Skenario {scen.ScenarioName}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: scen.ScenarioName === 'Actual' ? '#ef4444' : '#38bdf8', fontWeight: '600' }}>{formatCurrency(scen.TotalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
