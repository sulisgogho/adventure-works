import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, UserCheck, CalendarDays, HeartCrack, Building } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function HrDashboard() {
  const [hrData, setHrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/hr')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setHrData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data HRD.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching HR data:', err)
        setError('Gagal terhubung ke API HRD. Pastikan server Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Mengekstrak berkas data profil, departemen, dan log absensi karyawan...</p>
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>👥 Human Capital & Operational HR Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Memantau total alokasi tenaga kerja (*headcount*) per departemen serta analisis pemanfaatan jam cuti korporat.</p>
      </div>

      {/* ==========================================================
         A. KPI GRID SECTION
         ========================================================== */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <Users size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Total Roster Count</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatNumber(hrData?.kpi?.total_employees)} Karyawan</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <UserCheck size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Active Force</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#22c55e' }}>{formatNumber(hrData?.kpi?.active_employees)} Aktif</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <CalendarDays size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Avg Vacation Allocated</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{hrData?.kpi?.avg_vacation_hours} Jam</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
            <HeartCrack size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Avg Sick Leave Taken</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{hrData?.kpi?.avg_sick_leave_hours} Jam</h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
         B. VISUALISASI CHARTS SECTION
         ========================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        {/* Grafik Batang Vertikal: Headcount per Departemen */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#f8fafc' }}>📊 Talent Distribution across Corporate Departments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hrData?.department_distribution || []} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis dataKey="DepartmentName" type="category" stroke="var(--text)" style={{ fontSize: '11px' }} width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Headcount" fill="#38bdf8" name="Jumlah Staff (Orang)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grafik Batang Berdampingan: Analisis Cuti Berdasarkan Gender */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#f8fafc' }}>📈 Time-Off Utilization Framework by Gender</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hrData?.gender_leave_analysis || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="GenderLabel" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="AvgVacation" fill="#eab308" name="Avg Vacation Time (Hrs)" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="AvgSickLeave" fill="#ef4444" name="Avg Sick Leave (Hrs)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================================
         C. DETAILED DEPARTMENT headcount GRID TABLE
         ========================================================== */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Building size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📋 Sectional Workforce Roster Breakdown</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Nama Departemen</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Total Headcount Staff</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Kumulatif Alokasi Jam Libur Karyawan</th>
            </tr>
          </thead>
          <tbody>
            {hrData?.department_distribution?.map((dept, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>{dept.DepartmentName}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#38bdf8', fontWeight: '600' }}>{dept.Headcount} Anggota</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#eab308' }}>{formatNumber(dept.TotalVacation)} Jam</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
