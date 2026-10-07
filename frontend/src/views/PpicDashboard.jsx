import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Boxes, Layers, AlertCircle, Hourglass, LayoutGrid, BarChart3 } from 'lucide-react'
import api from '../utils/api' // Pastikan kita menggunakan instance axios yang sudah dikonfigurasi

export default function PpicDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/ppic')
      .then((response) => {
        if (response.data && response.data.kpi) {
          setData(response.data)
        } else {
          setError('Format data PPIC tidak sesuai.')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Gagal mengambil data PPIC:', err)
        setError('Gagal terhubung ke server backend Python. Pastikan Uvicorn menyala!')
        setLoading(false)
      })
  }, [])

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>
        <p>Mengkalkulasi level stok gudang, matriks ABC-XYZ, dan hari kecukupan persediaan...</p>
      </div>
    )
  if (error)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h3>🚨 Error Terjadi</h3>
        <p>{error}</p>
      </div>
    )

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '6px' }}>🏭 PPIC & Inventory Control Tower</h1>
        <p style={{ fontSize: '14px', color: 'var(--text)' }}>Pantau level kesehatan persediaan, perputaran modal barang (ITR), serta pengelompokan klasifikasi investasi.</p>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
            <Boxes size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Monitored SKUs</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.total_monitored_skus} Item</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(170, 59, 255, 0.1)', borderRadius: '10px' }}>
            <Layers size={24} color="#aa3bff" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Warehouse Stock Units</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.total_warehouse_units?.toLocaleString()} Pcs</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Critical Stockouts</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.critical_stockout_items} SKU</h3>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px' }}>
            <Hourglass size={24} color="#eab308" />
          </div>
          <div>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text)', fontWeight: '600' }}>Global Average DSI</p>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{data?.kpi?.avg_global_dsi} Days</h3>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '20px' }}>
        {/* Alokasi Status Kesehatan Stok */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>📊 Warehouse Stock Status Allocation</h3>
          <ResponsiveContainer width="100%" height={260} minWidth={0}>
            <BarChart data={data?.inventory_health || []} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis dataKey="StockStatus" type="category" stroke="var(--text)" style={{ fontSize: '11px' }} width={170} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ItemCount" fill="#38bdf8" name="Jumlah SKU" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Efisiensi Perputaran Kategori (ITR vs DSI) */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <BarChart3 size={18} color="#aa3bff" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>📈 Category Turnover Efficiency Ratio</h3>
          </div>
          <ResponsiveContainer width="100%" height={260} minWidth={0}>
            <BarChart data={data?.category_efficiency || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="EnglishProductCategoryName" stroke="var(--text)" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="left" orientation="left" stroke="#aa3bff" name="ITR" style={{ fontSize: '12px' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#eab308" name="DSI" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="AvgITR" fill="#aa3bff" name="Inventory Turnover (ITR)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="AvgDSI" fill="#eab308" name="Days Sales Inventory (DSI)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS ROW 2 (MATRIX ABC-XYZ DETAILED DISPLAY) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px', marginTop: '25px' }}>
        {/* Visual Matrix Kotak ABC-XYZ */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <LayoutGrid size={18} color="#22c55e" />
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>🧩 ABC - XYZ Cross-Classification Matrix (SKU Counts)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
            {data?.abc_xyz_matrix?.map((matrix, idx) => (
              <div key={idx} style={{ padding: '15px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#aa3bff', display: 'block' }}>
                  {matrix.ABC?.split(' ')[0]} × {matrix.XYZ?.split(' ')[0]}
                </span>
                <strong style={{ fontSize: '20px', color: 'var(--text-h)', marginTop: '4px', display: 'block' }}>{matrix.SKUCount}</strong>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>SKUs Monitored</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabel Item Kritis Tetap Dipertahankan */}
        <div className="dashboard-card" style={{ overflowX: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>🚨 Top 10 Critical Reorder Material List</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-h)', fontWeight: 'bold' }}>
                <th style={{ padding: '10px 6px' }}>Product Name</th>
                <th style={{ padding: '10px 6px', textAlign: 'right' }}>Stock</th>
                <th style={{ padding: '10px 6px', textAlign: 'right' }}>ROP</th>
                <th style={{ padding: '10px 6px' }}>ABC</th>
                <th style={{ padding: '10px 6px', textAlign: 'right' }}>DSI</th>
              </tr>
            </thead>
            <tbody>
              {data?.critical_items_list?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                  <td style={{ padding: '10px 6px', fontWeight: '500', color: 'var(--text-h)' }}>{item.EnglishProductName}</td>
                  <td style={{ padding: '10px 6px', textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{item.UnitsBalance?.toLocaleString()}</td>
                  <td style={{ padding: '10px 6px', textAlign: 'right' }}>{item.ReorderPoint?.toLocaleString()}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <span style={{ padding: '2px 6px', backgroundColor: 'rgba(170, 59, 255, 0.1)', color: '#aa3bff', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{item.ABC?.split(' ')[0]}</span>
                  </td>
                  <td style={{ padding: '10px 6px', textAlign: 'right' }}>{item.DSI === 999 ? 'No Out' : `${Math.round(item.DSI)}d`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
