import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Smile, Award, Users, MessageSquare, ThumbsUp } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function SentimentDashboard() {
  const [sentimentData, setSentimentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/analytics/sentiment')
      .then((response) => {
        if (response.data && response.data.status === 'success') {
          setSentimentData(response.data.data)
        } else {
          setError(response.data?.message || 'Gagal memproses data Sentimen Pasar.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching Sentiment data:', err)
        setError('Gagal terhubung ke API Sentiment. Pastikan server Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <p>Menganalisis umpan balik kualitatif dan skor kebahagiaan konsumen...</p>
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px', color: '#f8fafc' }}>❤️ Market Research & Sentiment Control</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Mengukur indeks kepuasan konsumen (CSAT Score), sentimen kategori produk, dan sebaran kepuasan berdasarkan demografi.</p>
      </div>

      {/* ==========================================================
         A. KPI GRID SECTION
         ========================================================== */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <MessageSquare size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Total Survey Responses</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{formatNumber(sentimentData?.kpi?.total_responses)} Feedback</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <Smile size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Average CSAT Score</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{sentimentData?.kpi?.avg_csat_score} / 5.0</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(170, 59, 255, 0.1)', borderRadius: '10px' }}>
            <ThumbsUp size={24} color="#aa3bff" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600' }}>Positive Sentiment Rate</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#f8fafc' }}>{sentimentData?.kpi?.csat_percentage}%</h3>
          </div>
        </div>
      </div>

      {/* ==========================================================
         B. VISUALISASI CHARTS SECTION
         ========================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        {/* Grafik Batang: Skor Sentimen per Kategori Produk */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Award size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>📊 Product Category Satisfaction Index</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sentimentData?.category_sentiment || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="ProductCategory" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis domain={[0, 5]} stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="AvgScore" fill="#38bdf8" name="Avg CSAT Score" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grafik Radar: Sentimen Berdasarkan Tingkat Pendidikan Pelanggan */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Users size={18} color="#aa3bff" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>🕸️ Customer CSAT Grouped by Education</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            {sentimentData?.education_sentiment && sentimentData.education_sentiment.length > 0 ? (
              <RadarChart cx="50%" cy="50%" radius="70%" data={sentimentData?.education_sentiment || []}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="Education" stroke="var(--text)" style={{ fontSize: '11px' }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="var(--text)" style={{ fontSize: '10px' }} />
                <Radar name="CSAT Score" dataKey="AvgScore" stroke="#aa3bff" fill="#aa3bff" fillOpacity={0.3} />
                <Tooltip />
                <Legend />
              </RadarChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <p>Data profil demografi pendidikan tidak ditemukan.</p>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ==========================================================
         C. DETAILED SENTIMENT MATRIX TABLE
         ========================================================== */}
      <div className="dashboard-card" style={{ marginTop: '25px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#f8fafc' }}>📋 Comprehensive Sentiment Matrix Overview</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: '#f8fafc', fontWeight: 'bold' }}>
              <th style={{ padding: '12px 8px' }}>Kategori Produk</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Total Responden Survei</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Nilai Indeks Kepuasan (CSAT)</th>
            </tr>
          </thead>
          <tbody>
            {sentimentData?.category_sentiment?.map((cat, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: '#94a3b8' }}>
                <td style={{ padding: '12px 8px', fontWeight: '500', color: '#f8fafc' }}>{cat.ProductCategory}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{formatNumber(cat.TotalFeedback)} Ulasan</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#38bdf8', fontWeight: '600' }}>{cat.AvgScore} / 5.0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
