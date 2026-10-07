import pandas as pd
import numpy as np
import os

# ==========================================================
# KUNCI JALUR FOLDER SECARA ABSOLUT (ANTI-SALAH FOLDER)
# ==========================================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
DATA_FOLDER = os.path.join(BACKEND_DIR, "data")

def load_logistics_csv(file_name, col_mapping):
    file_path = os.path.join(DATA_FOLDER, file_name)
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            first_line = f.readline()
        
        has_header = any(k in first_line.lower() for k in ['key', 'name', 'amount', 'date', 'cost'])
        
        if has_header:
            df = pd.read_csv(file_path, sep='|', on_bad_lines='skip', encoding='latin1')
            df.columns = df.columns.str.strip()
        else:
            df = pd.read_csv(file_path, sep='|', header=None, on_bad_lines='skip', encoding='latin1')
            available_cols = [c for c in col_mapping.keys() if c in df.columns]
            df = df[available_cols]
            df = df.rename(columns=col_mapping)
        
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].astype(str).str.strip()
            if any(keyword in str(col) for keyword in ['Key', 'Amount', 'Cost', 'Pct', 'Freight', 'Quantity']):
                df[col] = pd.to_numeric(df[col], errors='coerce')
                
        return df
    except Exception as e:
        print(f"🚨 [PATH ERROR] Gagal membaca file {file_name}: {str(e)}")
        return pd.DataFrame()

def get_all_logistics_analysis():
    # ==========================================================
    # 1. DEFINISI PEMETAAN KOLOM (SUDAH DIKALIBRASI)
    # ==========================================================
    sales_map = {
        0: 'ProductKey', 
        1: 'OrderDateKey', 
        2: 'DueDateKey', 
        3: 'ShipDateKey', 
        4: 'ResellerKey', 
        12: 'OrderQuantity', 
        19: 'SalesAmount',   
        21: 'Freight'        
    }
    reseller_map = {0: 'ResellerKey', 1: 'GeographyKey'}
    geo_map = {0: 'GeographyKey', 6: 'EnglishCountryRegionName'}

    # ==========================================================
    # 2. LOAD DATA MENGGUNAKAN JALUR AMAN
    # ==========================================================
    df_sales = load_logistics_csv("FactResellerSales.csv", sales_map)
    df_reseller = load_logistics_csv("DimReseller.csv", reseller_map)
    df_geo = load_logistics_csv("DimGeography.csv", geo_map)

    # Antisipasi nilai kosong
    df_sales['Freight'] = df_sales['Freight'].fillna(0)
    df_sales['SalesAmount'] = df_sales['SalesAmount'].fillna(0)
    df_sales['OrderQuantity'] = df_sales['OrderQuantity'].fillna(1)

    # ==========================================================
    # 3. DATA TRANSFORMATION: KONVERSI KEY MENJADI DATETIME
    # ==========================================================
    for col in ['OrderDateKey', 'DueDateKey', 'ShipDateKey']:
        df_sales[col] = df_sales[col].astype(str).str.split('.').str[0]
    
    df_sales['OrderDate'] = pd.to_datetime(df_sales['OrderDateKey'], format='%Y%m%d', errors='coerce')
    df_sales['DueDate'] = pd.to_datetime(df_sales['DueDateKey'], format='%Y%m%d', errors='coerce')
    df_sales['ShipDate'] = pd.to_datetime(df_sales['ShipDateKey'], format='%Y%m%d', errors='coerce')

    df_sales = df_sales.dropna(subset=['OrderDate', 'DueDate', 'ShipDate'])

    # ==========================================================
    # 4. PERHITUNGAN DURASI INTERVAL HARI
    # ==========================================================
    df_sales['DelayDays'] = (df_sales['ShipDate'] - df_sales['DueDate']).dt.days
    df_sales['LeadTimeDays'] = (df_sales['ShipDate'] - df_sales['OrderDate']).dt.days
    df_sales['IsOnTime'] = df_sales['DelayDays'] <= 0

    # ==========================================================
    # 5. KPI GLOBAL (OTD RATE & FREIGHT RATIO)
    # ==========================================================
    total_shipments = len(df_sales)
    ontime_shipments = int(df_sales['IsOnTime'].sum())
    otd_rate = (ontime_shipments / total_shipments) * 100 if total_shipments > 0 else 0
    
    df_delayed = df_sales[df_sales['DelayDays'] > 0]
    avg_delay = float(df_delayed['DelayDays'].mean()) if len(df_delayed) > 0 else 0
    avg_lead_time = float(df_sales['LeadTimeDays'].mean()) if total_shipments > 0 else 0
    
    total_freight = float(df_sales['Freight'].sum())
    total_sales = float(df_sales['SalesAmount'].sum())
    freight_to_revenue = (total_freight / total_sales) * 100 if total_sales > 0 else 0

    # Gabungkan data untuk analisis wilayah
    df_full = pd.merge(df_sales, df_reseller, on="ResellerKey")
    df_full = pd.merge(df_full, df_geo, on="GeographyKey")

    # GEOGRAPHIC PERFORMANCE
    geo_perf = df_full.groupby('EnglishCountryRegionName').agg(
        TotalVolume=('ProductKey', 'count'),
        OnTimeVolume=('IsOnTime', 'sum'),
        AvgLeadTime=('LeadTimeDays', 'mean'),
        TotalFreightCost=('Freight', 'sum'),
        TotalSalesAmount=('SalesAmount', 'sum')
    ).reset_index()

    geo_perf['OnTimeRatePct'] = (geo_perf['OnTimeVolume'] / geo_perf['TotalVolume']) * 100
    geo_perf['FreightRatioPct'] = (geo_perf['TotalFreightCost'] / geo_perf['TotalSalesAmount']) * 100
    geo_list = geo_perf.fillna(0).to_dict(orient='records')

    # LEAD TIME DISTRIBUTION
    lead_time_profile = df_sales.groupby('LeadTimeDays').size().reset_index(name='ShipmentCount')
    lead_time_list = lead_time_profile.head(15).to_dict(orient='records')

    # VOLUME VS DELAY MATRIKS
    volume_delay = df_full.groupby('OrderQuantity').agg(
        TotalOrders=('ProductKey', 'count'),
        AvgDelayDays=('DelayDays', 'mean'),
        OnTimeRatePct=('IsOnTime', 'mean')
    ).reset_index()
    volume_delay['OnTimeRatePct'] = volume_delay['OnTimeRatePct'] * 100
    
    volume_delay = volume_delay[volume_delay['TotalOrders'] > 5].sort_values(by='OrderQuantity')
    volume_list = volume_delay.fillna(0).to_dict(orient='records')

    return {
        "kpi": {
            "total_shipments": total_shipments,
            "on_time_delivery_rate": round(otd_rate, 2),
            "avg_delay_days": round(avg_delay, 1),
            "avg_lead_time_days": round(avg_lead_time, 1),
            "total_freight_cost": round(total_freight, 2),
            "freight_to_revenue_ratio": round(freight_to_revenue, 2)
        },
        "geography_logistics": geo_list,
        "lead_time_distribution": lead_time_list,
        "volume_vs_delay": volume_list
    }