import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Truck, Clock, AlertTriangle, Coins, Globe, Activity } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function LogisticsDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/logistics')
      .then((response) => {
        if (response.data && response.data.kpi) {
          setData(response.data)
        } else {
          setError('Format data logistik tidak sesuai.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Gagal mengambil data logistics:', err)
        setError('Gagal terhubung ke server backend Python. Pastikan Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
        <p>Mengunduh metrik pengiriman dan durasi lead time...</p>
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>🚚 Supply Chain & Logistics Dashboard</h1>
        <p style={{ fontSize: '14px', color: 'var(--text)' }}>Analisis On-Time Delivery (OTD), beban biaya logistik freight, dan bottleneck kapasitas volume pengiriman.</p>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <Truck size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Total Shipments</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.total_shipments?.toLocaleString()}</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
            <Clock size={24} color="#22c55e" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>OTD Rate</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.on_time_delivery_rate}%</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <AlertTriangle size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Avg Delay Duration</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.avg_delay_days} Days</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(170, 59, 255, 0.1)', borderRadius: '10px' }}>
            <Coins size={24} color="#aa3bff" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Freight/Revenue Ratio</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.freight_to_revenue_ratio}%</h3>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>🌍 Regional On-Time Delivery Performance</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <BarChart data={data?.geography_logistics || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="EnglishCountryRegionName" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis unit="%" domain={[0, 100]} stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'OTD Rate']} />
              <Legend />
              <Bar dataKey="OnTimeRatePct" fill="#22c55e" name="On-Time Rate (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>📊 Fulfillment Lead Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <LineChart data={data?.lead_time_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="LeadTimeDays" unit=" d" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis stroke="var(--text)" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => [value, 'Shipments']} />
              <Legend />
              <Line type="monotone" dataKey="ShipmentCount" stroke="#aa3bff" strokeWidth={3} name="Jumlah Pengiriman" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS ROW 2 (ANALYSIS UNPACKED) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '25px' }}>
        {/* Hubungan Ukuran Order vs Risiko Keterlambatan */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>📦 Order Size vs Delay Risk Impact</h3>
          </div>
          <ResponsiveContainer width="100%" height={260} minWidth={0}>
            <LineChart data={data?.volume_vs_delay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="OrderQuantity" name="Qty per Order" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" stroke="#ef4444" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#22c55e" unit="%" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="AvgDelayDays" stroke="#ef4444" name="Avg Delay (Days)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="OnTimeRatePct" stroke="#22c55e" name="OTD Rate (%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabel Ongkir & Volume Regional */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <Globe size={18} color="#aa3bff" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>🌐 Geographic Freight Cost Efficiency</h3>
          </div>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-h)', fontWeight: 'bold' }}>
                  <th style={{ padding: '10px 6px' }}>Negara Tujuan</th>
                  <th style={{ padding: '10px 6px', textAlign: 'right' }}>Volume Kirim</th>
                  <th style={{ padding: '10px 6px', textAlign: 'right' }}>Total Freight</th>
                  <th style={{ padding: '10px 6px', textAlign: 'right' }}>Ratio to Sales</th>
                </tr>
              </thead>
              <tbody>
                {data?.geography_logistics?.map((geo, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                    <td style={{ padding: '10px 6px', fontWeight: '500', color: 'var(--text-h)' }}>{geo.EnglishCountryRegionName}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>{geo.TotalVolume?.toLocaleString()} Box</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: '#aa3bff', fontWeight: '600' }}>{formatCurrency(geo.TotalFreightCost)}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          backgroundColor: geo.FreightRatioPct > 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: geo.FreightRatioPct > 2 ? '#ef4444' : '#22c55e',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        {Number(geo.FreightRatioPct).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
