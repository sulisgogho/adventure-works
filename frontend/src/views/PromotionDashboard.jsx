import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Megaphone, Flame, BadgePercent, Layers, BarChart3 } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function PromotionDashboard() {
  const [promoData, setPromoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/promotion')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setPromoData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data Promosi Pemasaran.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching Promotion data:', err)
        setError('Gagal terhubung ke API Promotion. Pastikan server Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Mengkalkulasi rasio pembakaran diskon dan kontribusi margin omset dari program iklan...</p>
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

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>📢 Corporate Promotion & Marketing Impact Control</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Mengukur tingkat pengembalian investasi pemasaran (*ROI*), penetrasi program diskon, dan efektivitas tiap tipe kampanye.</p>
      </div>

      {/* ==========================================================
         A. KPI GRID SECTION
         ========================================================== */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <Megaphone size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Gross Campaign Revenue</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatCurrency(promoData?.kpi?.total_campaign_revenue)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
            <Flame size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Discounts Burned</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#ef4444' }}>{formatCurrency(promoData?.kpi?.total_discount_given)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <BadgePercent size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Promo Ticket Vol</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#22c55e' }}>{formatNumber(promoData?.kpi?.promo_transactions)} Tx</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <Layers size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Promo Penetration Rate</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{promoData?.kpi?.promo_penetration_rate}%</h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
         B. VISUALISASI CHARTS SECTION
         ========================================================== */}
      <div style={{ marginTop: '25px' }}>
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <BarChart3 size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📊 Sales Performance Framework by Promotion Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={promoData?.promo_type_performance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="PromotionType" stroke="var(--text)" style={{ fontSize: '11px' }} />
              <YAxis tickFormatter={(v) => `$${v / 1e6}M`} stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="TotalSales" fill="#aa3bff" name="Total Revenue Generated ($)" radius={[4, 4, 0, 0]} barSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================================
         C. DETAILED CAMPAIGN LEDGER MATRIX
         ========================================================== */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#f8fafc' }}>📋 Top 10 High-Yield Marketing Campaigns Matrix</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Nama Kampanye Pemasaran (Campaign)</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Anggaran Diskon Terbakar (Burned)</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Hasil Omset (Gross Revenue)</th>
            </tr>
          </thead>
          <tbody>
            {promoData?.top_campaigns?.map((camp, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>{camp.PromotionName}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#ef4444', fontWeight: '500' }}>{formatCurrency(camp.DiscountBurned)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#22c55e', fontWeight: '600' }}>{formatCurrency(camp.RevenueContribution)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
