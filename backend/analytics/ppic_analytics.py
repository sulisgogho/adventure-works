import pandas as pd
import numpy as np
import os

# ==========================================================
# KUNCI JALUR FOLDER SECARA ABSOLUT
# ==========================================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
DATA_FOLDER = os.path.join(BACKEND_DIR, "data")

def load_ppic_csv(file_name, col_mapping):
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
            if any(keyword in str(col) for keyword in ['Key', 'Amount', 'Cost', 'Pct', 'Freight', 'Level', 'Point', 'Balance', 'In', 'Out']):
                df[col] = pd.to_numeric(df[col], errors='coerce')
                
        return df
    except Exception as e:
        print(f"🚨 [PATH ERROR] Gagal membaca file {file_name}: {str(e)}")
        return pd.DataFrame()

def get_all_ppic_analysis():
    inv_map = {0: 'ProductKey', 1: 'DateKey', 2: 'UnitIn', 3: 'UnitOut', 4: 'UnitsBalance'}
    prod_map = {0: 'ProductKey', 2: 'ProductSubcategoryKey', 5: 'EnglishProductName', 11: 'SafetyStockLevel', 12: 'ReorderPoint'}
    subcat_map = {0: 'ProductSubcategoryKey', 2: 'EnglishProductSubcategoryName', 5: 'ProductCategoryKey'}
    cat_map = {0: 'ProductCategoryKey', 2: 'EnglishProductCategoryName'}
    sales_map = {0: 'ProductKey', 18: 'TotalProductCost', 19: 'SalesAmount'} 

    df_inv = load_ppic_csv("FactProductInventory.csv", inv_map)
    df_product = load_ppic_csv("DimProduct.csv", prod_map)
    df_subcat = load_ppic_csv("DimProductSubcategory.csv", subcat_map)
    df_cat = load_ppic_csv("DimProductCategory.csv", cat_map)
    df_sales = load_ppic_csv("FactResellerSales.csv", sales_map)

    df_inv['UnitsBalance'] = df_inv['UnitsBalance'].fillna(0)
    df_inv['UnitIn'] = df_inv['UnitIn'].fillna(0)
    df_inv['UnitOut'] = df_inv['UnitOut'].fillna(0)
    df_sales['SalesAmount'] = df_sales['SalesAmount'].fillna(0)
    df_sales['TotalProductCost'] = df_sales['TotalProductCost'].fillna(0)

    latest_inv = df_inv.sort_values('DateKey').groupby('ProductKey').last().reset_index()
    
    df_full = pd.merge(latest_inv, df_product, on="ProductKey")
    df_full = pd.merge(df_full, df_subcat, on="ProductSubcategoryKey")
    df_full = pd.merge(df_full, df_cat, on="ProductCategoryKey")

    if df_full.empty:
        return {
            "kpi": {"total_monitored_skus": 0, "total_warehouse_units": 0, "critical_stockout_items": 0, "reorder_warnings": 0, "avg_global_dsi": 0},
            "inventory_health": [], "abc_xyz_matrix": [], "critical_items_list": [], "category_efficiency": []
        }

    cogs_perf = df_sales.groupby('ProductKey')['TotalProductCost'].sum().reset_index(name='TotalCOGS')
    inv_stats = df_inv.groupby('ProductKey').agg(AvgBalance=('UnitsBalance', 'mean'), TotalUnitOut=('UnitOut', 'sum')).reset_index()
    df_financial = pd.merge(inv_stats, cogs_perf, on="ProductKey", how="left").fillna(0)
    
    df_financial['ITR'] = df_financial['TotalUnitOut'] / df_financial['AvgBalance']
    df_financial['ITR'] = df_financial['ITR'].replace([np.inf, -np.inf], 0).fillna(0)
    df_financial['DSI'] = np.where(df_financial['ITR'] > 0, 365 / df_financial['ITR'], 999)

    prod_sales = df_sales.groupby('ProductKey')['SalesAmount'].sum().sort_values(ascending=False).reset_index()
    prod_sales['CumSales'] = prod_sales['SalesAmount'].cumsum()
    total_sales_amount = prod_sales['SalesAmount'].sum()
    prod_sales['CumPct'] = prod_sales['CumSales'] / total_sales_amount if total_sales_amount > 0 else 0
    
    def calc_abc(pct):
        if pct <= 0.70: return 'A (High Value)'
        elif pct <= 0.90: return 'B (Medium Value)'
        else: return 'C (Low Value)'
    prod_sales['ABC'] = prod_sales['CumPct'].apply(calc_abc)

    daily_out_stats = df_inv.groupby('ProductKey')['UnitOut'].agg(['mean', 'std']).reset_index()
    daily_out_stats['std'] = daily_out_stats['std'].fillna(0)
    daily_out_stats['CoV'] = np.where(daily_out_stats['mean'] > 0, daily_out_stats['std'] / daily_out_stats['mean'], 99)
    
    def calc_xyz(cov):
        if cov <= 0.5: return 'X (Stable Demand)'
        elif cov <= 1.0: return 'Y (Volatile/Seasonal)'
        else: return 'Z (Highly Unpredictable)'
    daily_out_stats['XYZ'] = daily_out_stats['CoV'].apply(calc_xyz)

    df_full = pd.merge(df_full, df_financial[['ProductKey', 'ITR', 'DSI']], on="ProductKey", how="left")
    df_full = pd.merge(df_full, prod_sales[['ProductKey', 'ABC']], on="ProductKey", how="left").fillna({'ABC': 'C (Low Value)'})
    df_full = pd.merge(df_full, daily_out_stats[['ProductKey', 'XYZ']], on="ProductKey", how="left").fillna({'XYZ': 'Z (Highly Unpredictable)'})

    df_full['SafetyStockLevel'] = df_full['SafetyStockLevel'].fillna(100)
    df_full['ReorderPoint'] = df_full['ReorderPoint'].fillna(150)
    df_full['MaxStockLevel'] = df_full['ReorderPoint'] * 2

    def determine_stock_status(row):
        balance = row['UnitsBalance']
        rop = row['ReorderPoint']
        ss = row['SafetyStockLevel']
        max_s = row['MaxStockLevel']
        
        if balance <= ss: return '1. CRITICAL (Below Safety Stock)'
        elif balance <= rop: return '2. WARNING (Need Reorder)'
        elif balance > max_s: return '4. OVERSTOCK (Capital Locked)'
        else: return '3. NORMAL'

    df_full['StockStatus'] = df_full.apply(determine_stock_status, axis=1)
    df_full['StockStatus'] = df_full['StockStatus'].astype(str)

    status_summary = df_full.groupby('StockStatus').size().reset_index(name='ItemCount').to_dict(orient='records')
    abc_xyz_summary = df_full.groupby(['ABC', 'XYZ']).size().reset_index(name='SKUCount').to_dict(orient='records')
    
    critical_list = df_full[df_full['StockStatus'].str.contains('CRITICAL|WARNING')].sort_values(by='UnitsBalance').head(10)
    critical_records = critical_list[['EnglishProductName', 'UnitsBalance', 'SafetyStockLevel', 'ReorderPoint', 'ABC', 'DSI']].to_dict(orient='records')
    
    cat_financials = df_full.groupby('EnglishProductCategoryName').agg(
        TotalUnitsInWarehouse=('UnitsBalance', 'sum'), AvgITR=('ITR', 'mean'), AvgDSI=('DSI', 'mean')
    ).reset_index().to_dict(orient='records')

    return {
        "kpi": {
            "total_monitored_skus": len(df_full),
            "total_warehouse_units": float(df_full['UnitsBalance'].sum()),
            "critical_stockout_items": int((df_full['StockStatus'].str.contains('CRITICAL')).sum()),
            "reorder_warnings": int((df_full['StockStatus'].str.contains('WARNING')).sum()),
            "avg_global_dsi": round(float(df_full[df_full['DSI'] < 999]['DSI'].mean()), 1)
        },
        "inventory_health": status_summary,
        "abc_xyz_matrix": abc_xyz_summary,
        "critical_items_list": critical_records,
        "category_efficiency": cat_financials
    }