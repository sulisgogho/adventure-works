import os
import pandas as pd
import numpy as np

def load_territory_csv_safe(file_path, default_columns):
    """Membaca file CSV Teritori dengan toleransi tinggi terhadap header."""
    try:
        if not os.path.exists(file_path):
            return pd.DataFrame()

        df_check = pd.read_csv(file_path, sep='|', nrows=2, header=None, encoding='latin1')
        
        is_header = False
        if not df_check.empty:
            first_row_samples = df_check.iloc[0].astype(str).tolist()
            is_header = any(any(k in cell.lower() for k in ['key', 'id', 'region', 'country', 'group', 'territory']) for cell in first_row_samples)
        
        if is_header:
            df = pd.read_csv(file_path, sep='|', encoding='latin1')
            df.columns = df.columns.str.strip()
        else:
            df = pd.read_csv(file_path, sep='|', header=None, encoding='latin1')
            df.columns = [default_columns[i] if i < len(default_columns) else f'Col_{i}' for i in range(len(df.columns))]
            
        df.columns = df.columns.astype(str).str.strip()
        return df
    except Exception as e:
        print(f"🚨 [TERRITORY ERROR] Gagal membaca {os.path.basename(file_path)}: {str(e)}")
        return pd.DataFrame()

def get_territory_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    # Skema kolom default FactInternetSales & DimSalesTerritory berdasarkan AdventureWorks
    fact_sales_cols = ['ProductKey', 'OrderDateKey', 'DueDateKey', 'ShipDateKey', 'CustomerKey', 'PromotionKey', 'CurrencyKey', 'SalesTerritoryKey', 'SalesOrderNumber', 'SalesOrderLineNumber', 'RevisionNumber', 'OrderQuantity', 'UnitPrice', 'ExtendedAmount', 'UnitPriceDiscountPct', 'DiscountAmount', 'ProductStandardCost', 'TotalProductCost', 'SalesAmount']
    territory_cols = ['SalesTerritoryKey', 'SalesTerritoryAlternateKey', 'SalesTerritoryRegion', 'SalesTerritoryCountry', 'SalesTerritoryGroup']

    df_sales = load_territory_csv_safe(os.path.join(data_dir, "FactInternetSales.csv"), fact_sales_cols)
    df_terr = load_territory_csv_safe(os.path.join(data_dir, "DimSalesTerritory.csv"), territory_cols)

    if df_sales.empty or df_terr.empty:
        return {"kpi": {}, "group_performance": [], "country_performance": []}

    # ==========================================================
    # DETEKSI KOLOM DINAMIS
    # ==========================================================
    sales_amt_col = next((c for c in df_sales.columns if 'salesamount' in c.lower()), df_sales.columns[-1])
    order_qty_col = next((c for c in df_sales.columns if 'orderquantity' in c.lower()), None)
    
    terr_key_sales = next((c for c in df_sales.columns if 'territorykey' in c.lower()), df_sales.columns[7])
    terr_key_dim = next((c for c in df_terr.columns if 'territorykey' in c.lower()), df_terr.columns[0])
    
    group_col = next((c for c in df_terr.columns if 'group' in c.lower()), df_terr.columns[-1])
    country_col = next((c for c in df_terr.columns if 'country' in c.lower()), df_terr.columns[-2])
    region_col = next((c for c in df_terr.columns if 'region' in c.lower()), df_terr.columns[2])

    # Clean data numerik
    df_sales['SalesAmount'] = pd.to_numeric(df_sales[sales_amt_col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce').fillna(0)
    df_sales['OrderQuantity'] = pd.to_numeric(df_sales[order_qty_col], errors='coerce').fillna(0).astype(int) if order_qty_col else 1
    
    df_sales['SalesTerritoryKey'] = pd.to_numeric(df_sales[terr_key_sales], errors='coerce').fillna(-1).astype(int)
    df_terr['SalesTerritoryKey'] = pd.to_numeric(df_terr[terr_key_dim], errors='coerce').fillna(-2).astype(int)

    # Standardisasi Teks Dimensi
    df_terr['TerritoryGroup'] = df_terr[group_col].astype(str).str.strip()
    df_terr['TerritoryCountry'] = df_terr[country_col].astype(str).str.strip()
    df_terr['TerritoryRegion'] = df_terr[region_col].astype(str).str.strip()

    # Gabungkan data penjualan dengan master teritori
    df_merged = pd.merge(df_sales, df_terr, on="SalesTerritoryKey", how="inner")

    if df_merged.empty:
        return {"kpi": {}, "group_performance": [], "country_performance": []}

    # 1. HITUNG KPI UTAMA EXPANSION
    total_global_revenue = float(df_merged['SalesAmount'].sum())
    total_items_shipped = int(df_merged['OrderQuantity'].sum())
    active_countries = int(df_merged['TerritoryCountry'].nunique())
    active_regions = int(df_merged['TerritoryRegion'].nunique())

    kpi = {
        "total_global_revenue": round(total_global_revenue, 2),
        "total_items_shipped": total_items_shipped,
        "active_countries": active_countries,
        "active_regions": active_regions
    }

    # 2. PERFORMA KONTRIBUSI GLOBAL GROUP (PIE / DONUT CHART COMPATIBLE)
    group_perf = df_merged.groupby('TerritoryGroup').agg(
        TotalSales=('SalesAmount', 'sum'),
        TotalQty=('OrderQuantity', 'sum')
    ).reset_index().rename(columns={'TotalSales': 'Value'}) # Ganti 'Value' agar ramah PieChart frontend
    group_perf_list = group_perf.to_dict(orient='records')

    # 3. TOP COUNTRY BREAKDOWN (BAR CHART)
    country_perf = df_merged.groupby('TerritoryCountry').agg(
        TotalRevenue=('SalesAmount', 'sum'),
        VolumeOrder=('OrderQuantity', 'sum')
    ).reset_index().sort_values(by='TotalRevenue', ascending=False)
    country_perf_list = country_perf.to_dict(orient='records')

    return {
        "kpi": kpi,
        "group_performance": group_perf_list,
        "country_performance": country_perf_list
    }