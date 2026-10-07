import pandas as pd
import numpy as np
import os

# ==========================================================
# KUNCI JALUR FOLDER SECARA ABSOLUT
# ==========================================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
DATA_FOLDER = os.path.join(BACKEND_DIR, "data")

def load_adventure_works_csv(file_name, col_mapping):
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
            if any(keyword in str(col) for keyword in ['Key', 'Amount', 'Cost', 'Pct', 'Freight']):
                df[col] = pd.to_numeric(df[col], errors='coerce')
                
        return df
    except Exception as e:
        print(f"🚨 [PATH ERROR] Gagal membaca file {file_name}: {str(e)}")
        return pd.DataFrame()

def get_all_sales_analysis():
    # Pemetaan kolom hasil kalibrasi data mentah
    sales_map = {0: 'ProductKey', 1: 'OrderDateKey', 2: 'DueDateKey', 3: 'ShipDateKey', 4: 'ResellerKey', 15: 'UnitPriceDiscountPct', 18: 'TotalProductCost', 19: 'SalesAmount', 21: 'Freight'}
    prod_map = {0: 'ProductKey', 2: 'ProductSubcategoryKey', 5: 'EnglishProductName'}
    subcat_map = {0: 'ProductSubcategoryKey', 2: 'EnglishProductSubcategoryName', 5: 'ProductCategoryKey'}
    cat_map = {0: 'ProductCategoryKey', 2: 'EnglishProductCategoryName'}
    date_map = {0: 'DateKey', 9: 'EnglishMonthName', 12: 'MonthNumberOfYear', 14: 'CalendarYear'}
    reseller_map = {0: 'ResellerKey', 1: 'GeographyKey', 3: 'ResellerName'}
    geo_map = {0: 'GeographyKey', 6: 'EnglishCountryRegionName'}

    df_sales = load_adventure_works_csv("FactResellerSales.csv", sales_map)
    df_product = load_adventure_works_csv("DimProduct.csv", prod_map)
    df_subcat = load_adventure_works_csv("DimProductSubcategory.csv", subcat_map)
    df_cat = load_adventure_works_csv("DimProductCategory.csv", cat_map)
    df_date = load_adventure_works_csv("DimDate.csv", date_map)
    df_reseller = load_adventure_works_csv("DimReseller.csv", reseller_map)
    df_geo = load_adventure_works_csv("DimGeography.csv", geo_map)

    df_sales['TotalProductCost'] = df_sales['TotalProductCost'].fillna(0)
    df_sales['SalesAmount'] = df_sales['SalesAmount'].fillna(0)
    df_sales['UnitPriceDiscountPct'] = df_sales['UnitPriceDiscountPct'].fillna(0)

    total_revenue = float(df_sales['SalesAmount'].sum())
    total_cost = float(df_sales['TotalProductCost'].sum())
    total_profit = total_revenue - total_cost
    global_margin = (total_profit / total_revenue) * 100 if total_revenue > 0 else 0

    df_prod_full = pd.merge(df_sales, df_product, on="ProductKey")
    df_prod_full = pd.merge(df_prod_full, df_subcat, on="ProductSubcategoryKey")
    df_prod_full = pd.merge(df_prod_full, df_cat, on="ProductCategoryKey")

    product_matrix = df_prod_full.groupby('EnglishProductCategoryName').agg(
        Revenue=('SalesAmount', 'sum'),
        Cost=('TotalProductCost', 'sum')
    ).reset_index()
    product_matrix['Profit'] = product_matrix['Revenue'] - product_matrix['Cost']
    product_matrix['MarginPct'] = (product_matrix['Profit'] / product_matrix['Revenue']) * 100
    product_matrix_list = product_matrix.to_dict(orient='records')

    df_prod_full['Profit'] = df_prod_full['SalesAmount'] - df_prod_full['TotalProductCost']
    discount_analysis = df_prod_full.groupby('EnglishProductSubcategoryName').agg(
        AvgDiscountPct=('UnitPriceDiscountPct', 'mean'),
        TotalRevenue=('SalesAmount', 'sum'),
        TotalProfit=('Profit', 'sum')
    ).reset_index()
    
    discount_analysis['AvgDiscountPct'] = discount_analysis['AvgDiscountPct'] * 100
    discount_analysis['MarginPct'] = (discount_analysis['TotalProfit'] / discount_analysis['TotalRevenue']) * 100
    discount_list = discount_analysis.fillna(0).to_dict(orient='records')

    df_reseller_full = pd.merge(df_sales, df_reseller, on="ResellerKey")
    reseller_perf = df_reseller_full.groupby('ResellerName')['SalesAmount'].sum().reset_index()
    
    def assign_tier(sales):
        if sales >= 200000: return 'Platinum VIP'
        elif sales >= 50000: return 'Gold Retailer'
        else: return 'Silver Partner'
        
    reseller_perf['Tier'] = reseller_perf['SalesAmount'].apply(assign_tier)
    tier_summary = reseller_perf.groupby('Tier').agg(
        TotalSales=('SalesAmount', 'sum'),
        TotalCustomers=('ResellerName', 'count')
    ).reset_index().to_dict(orient='records')

    df_geo_full = pd.merge(df_reseller_full, df_geo, on="GeographyKey")
    geo_perf = df_geo_full.groupby('EnglishCountryRegionName').agg(
        TotalSales=('SalesAmount', 'sum'),
        AvgFreight=('Freight', 'mean')
    ).reset_index().sort_values(by='TotalSales', ascending=False)
    geo_list = geo_perf.to_dict(orient='records')

    df_date_full = pd.merge(df_sales, df_date, left_on="OrderDateKey", right_on="DateKey")
    monthly_trend = df_date_full.groupby(['CalendarYear', 'MonthNumberOfYear', 'EnglishMonthName'])['SalesAmount'].sum().reset_index()
    
    latest_year = monthly_trend['CalendarYear'].max()
    monthly_list = monthly_trend[monthly_trend['CalendarYear'] == latest_year].sort_values(by='MonthNumberOfYear').to_dict(orient='records')

    return {
        "kpi": {
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "total_profit": round(total_profit, 2),
            "profit_margin": round(global_margin, 2)
        },
        "product_portfolio": product_matrix_list,
        "discount_impact": discount_list,
        "reseller_tiering": tier_summary,
        "geography_performance": geo_list,
        "seasonality_trend": monthly_list
    }