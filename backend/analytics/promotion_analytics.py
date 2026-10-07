import os
import pandas as pd
import numpy as np

def load_promotion_csv_safe(file_path, default_columns):
    """Membaca file CSV Promosi dengan toleransi tinggi terhadap header."""
    try:
        if not os.path.exists(file_path):
            return pd.DataFrame()

        df_check = pd.read_csv(file_path, sep='|', nrows=2, header=None, encoding='latin1')
        
        is_header = False
        if not df_check.empty:
            first_row_samples = df_check.iloc[0].astype(str).tolist()
            is_header = any(any(k in cell.lower() for k in ['key', 'id', 'promotion', 'promo', 'discount', 'type']) for cell in first_row_samples)
        
        if is_header:
            df = pd.read_csv(file_path, sep='|', encoding='latin1')
            df.columns = df.columns.str.strip()
        else:
            df = pd.read_csv(file_path, sep='|', header=None, encoding='latin1')
            df.columns = [default_columns[i] if i < len(default_columns) else f'Col_{i}' for i in range(len(df.columns))]
            
        df.columns = df.columns.astype(str).str.strip()
        return df
    except Exception as e:
        print(f"🚨 [PROMOTION ERROR] Gagal membaca {os.path.basename(file_path)}: {str(e)}")
        return pd.DataFrame()

def get_promotion_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    # Skema kolom default FactInternetSales & DimPromotion berdasarkan AdventureWorks
    fact_sales_cols = ['ProductKey', 'OrderDateKey', 'DueDateKey', 'ShipDateKey', 'CustomerKey', 'PromotionKey', 'CurrencyKey', 'SalesTerritoryKey', 'SalesOrderNumber', 'SalesOrderLineNumber', 'RevisionNumber', 'OrderQuantity', 'UnitPrice', 'ExtendedAmount', 'UnitPriceDiscountPct', 'DiscountAmount', 'ProductStandardCost', 'TotalProductCost', 'SalesAmount']
    promo_cols = ['PromotionKey', 'PromotionAlternateKey', 'EnglishPromotionName', 'DiscountPct', 'EnglishPromotionType', 'EnglishPromotionCategory', 'StartDate', 'EndDate', 'MinQty', 'MaxQty']

    df_sales = load_promotion_csv_safe(os.path.join(data_dir, "FactInternetSales.csv"), fact_sales_cols)
    df_promo = load_promotion_csv_safe(os.path.join(data_dir, "DimPromotion.csv"), promo_cols)

    if df_sales.empty or df_promo.empty:
        return {"kpi": {}, "promo_type_performance": [], "top_campaigns": []}

    # ==========================================================
    # DETEKSI KOLOM DINAMIS
    # ==========================================================
    sales_amt_col = next((c for c in df_sales.columns if 'salesamount' in c.lower()), df_sales.columns[-1])
    discount_col = next((c for c in df_sales.columns if 'discountamount' in c.lower()), None)
    order_qty_col = next((c for c in df_sales.columns if 'orderquantity' in c.lower()), None)
    
    promo_key_sales = next((c for c in df_sales.columns if 'promotionkey' in c.lower()), df_sales.columns[5])
    promo_key_dim = next((c for c in df_promo.columns if 'promotionkey' in c.lower()), df_promo.columns[0])
    
    promo_name_col = next((c for c in df_promo.columns if 'englishpromotionname' in c.lower() or 'name' in c.lower()), df_promo.columns[2])
    promo_type_col = next((c for c in df_promo.columns if 'englishpromotiontype' in c.lower() or 'type' in c.lower()), df_promo.columns[4])

    # Clean data numerik
    df_sales['SalesAmount'] = pd.to_numeric(df_sales[sales_amt_col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce').fillna(0)
    df_sales['DiscountAmount'] = pd.to_numeric(df_sales[discount_col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce').fillna(0) if discount_col else 0
    df_sales['OrderQuantity'] = pd.to_numeric(df_sales[order_qty_col], errors='coerce').fillna(0).astype(int) if order_qty_col else 1
    
    df_sales['PromotionKey'] = pd.to_numeric(df_sales[promo_key_sales], errors='coerce').fillna(-1).astype(int)
    df_promo['PromotionKey'] = pd.to_numeric(df_promo[promo_key_dim], errors='coerce').fillna(-2).astype(int)

    # Standardisasi Teks Dimensi
    df_promo['PromotionName'] = df_promo[promo_name_col].astype(str).str.strip()
    df_promo['PromotionType'] = df_promo[promo_type_col].astype(str).str.strip()

    # Gabungkan data penjualan dengan master promosi
    df_merged = pd.merge(df_sales, df_promo, on="PromotionKey", how="inner")

    if df_merged.empty:
        return {"kpi": {}, "promo_type_performance": [], "top_campaigns": []}

    # 1. HITUNG KPI UTAMA MARKETING
    total_revenue = float(df_merged['SalesAmount'].sum())
    total_discount_given = float(df_merged['DiscountAmount'].sum())
    sales_with_promo = len(df_merged[df_merged['PromotionKey'] > 1]) # ID 1 biasanya 'No Promotion'
    
    # Rasio penetrasi promo terhadap total transaksi
    promo_penetration_rate = (sales_with_promo / len(df_sales)) * 100 if len(df_sales) > 0 else 0

    kpi = {
        "total_campaign_revenue": round(total_revenue, 2),
        "total_discount_given": round(total_discount_given, 2),
        "promo_transactions": sales_with_promo,
        "promo_penetration_rate": round(promo_penetration_rate, 1)
    }

    # 2. PERFORMA BERDASARKAN JENIS PROMOSI (BAR CHART)
    type_perf = df_merged.groupby('PromotionType').agg(
        TotalSales=('SalesAmount', 'sum'),
        TotalQty=('OrderQuantity', 'sum')
    ).reset_index().sort_values(by='TotalSales', ascending=False).to_dict(orient='records')

    # 3. TOP KAMPANYE PEMASARAN SPESIFIK (REVENUE CONTRIBUTOR LIST)
    campaign_perf = df_merged.groupby('PromotionName').agg(
        RevenueContribution=('SalesAmount', 'sum'),
        DiscountBurned=('DiscountAmount', 'sum')
    ).reset_index().sort_values(by='RevenueContribution', ascending=False).head(10)
    
    campaign_perf['RevenueContribution'] = campaign_perf['RevenueContribution'].round(2)
    campaign_perf['DiscountBurned'] = campaign_perf['DiscountBurned'].round(2)
    campaign_list = campaign_perf.to_dict(orient='records')

    return {
        "kpi": kpi,
        "promo_type_performance": type_perf,
        "top_campaigns": campaign_list
    }