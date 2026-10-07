import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Phone, AlertCircle, ShoppingBasket, Clock, Percent, ShieldCheck } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function CallCenterDashboard() {
  const [ccData, setCcData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/callcenter')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setCcData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data Call Center.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching Call Center data:', err)
        setError('Gagal terhubung ke API Call Center. Pastikan Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Mengekstrak log panggilan masuk dan durasi penanganan keluhan...</p>
      </div>
    )
  if (error)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h3>🚨 Error Terjadi</h3>
        <p>{error}</p>
      </div>
    )

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>🎧 Customer Service & Call Center Tower</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Memantau beban panggilan masuk, durasi penyelesaian masalah (SLA), dan rasio konversi pesanan via telepon.</p>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <Phone size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Total Calls Incoming</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatNumber(ccData?.kpi?.total_calls)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Issues Raised</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatNumber(ccData?.kpi?.total_issues)}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <Clock size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Avg Handling Time (AHT)</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{ccData?.kpi?.avg_handling_time_seconds} Detik</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <Percent size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Phone Conversion Rate</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{ccData?.kpi?.conversion_rate}%</h3>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        {/* PERBAIKAN 1: Mengubah ke BarChart Tunggal untuk Mengamankan Data yang Hanya 1 Bulan */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#f8fafc' }}>📊 Monthly Traffic Volume Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ccData?.monthly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="EnglishMonthName" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="IncomingCalls" fill="#38bdf8" name="Incoming Panggilan" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ResolvedOrders" fill="#eab308" name="Pesanan via Telepon" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PERBAIKAN 2: Menggunakan ComposedChart (Kombinasi Batang + Garis) untuk Mengatasi Skala Jomplang */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShieldCheck size={18} color="#22c55e" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📈 Operational Efficiency by Work Shift</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={ccData?.shift_performance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="Shift" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              {/* Komplain Masuk kita jadikan grafik batang */}
              <Bar dataKey="TotalIssues" fill="#ef4444" name="Komplain Masuk" radius={[4, 4, 0, 0]} barSize={40} />
              {/* Beban Panggilan kita jadikan grafik garis tebal di atasnya agar tidak tenggelam */}
              <Line type="monotone" dataKey="TotalCalls" stroke="#38bdf8" strokeWidth={3} name="Beban Panggilan" dot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OPERATIONAL SHIFT MATRIX TABLE */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <ShoppingBasket size={18} color="#eab308" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📋 Operational Efficiency Matrix by Shift</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Nama Shift Kerja</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Calls</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Total Complaints Raised</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Tele-Sales Orders Generated</th>
            </tr>
          </thead>
          <tbody>
            {ccData?.shift_performance?.map((shift, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>Shift {shift.Shift}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#38bdf8', fontWeight: '600' }}>{formatNumber(shift.TotalCalls)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ef4444' }}>{formatNumber(shift.TotalIssues)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#eab308', fontWeight: '600' }}>{formatNumber(shift.TotalOrders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
