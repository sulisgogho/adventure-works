import os
import pandas as pd
import numpy as np

def load_b2c_csv_bulletproof(file_path, default_columns):
    """Membaca CSV dengan deteksi header dinamis dan pembersihan nama kolom."""
    try:
        if not os.path.exists(file_path):
            return pd.DataFrame()

        df_check = pd.read_csv(file_path, sep='|', nrows=2, header=None, encoding='latin1')
        
        is_header = False
        if not df_check.empty:
            first_row_samples = df_check.iloc[0].astype(str).tolist()
            is_header = any(any(k in cell.lower() for k in ['key', 'name', 'amount', 'date', 'cost', 'income', 'year']) for cell in first_row_samples)
        
        if is_header:
            df = pd.read_csv(file_path, sep='|', encoding='latin1')
            df.columns = df.columns.str.strip()
        else:
            df = pd.read_csv(file_path, sep='|', header=None, encoding='latin1')
            df.columns = [default_columns[i] if i < len(default_columns) else f'Col_{i}' for i in range(len(df.columns))]
            
        # Standardisasi teks nama kolom agar bersih dari spasi gaib
        df.columns = df.columns.astype(str).str.strip()
        return df
    except Exception as e:
        print(f"🚨 [B2C SYSTEM ERROR] Gagal membaca {os.path.basename(file_path)}: {str(e)}")
        return pd.DataFrame()

def get_b2c_analytics_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    # Skema nama kolom default jika file terdeteksi tanpa header
    fact_sales_cols = ['ProductKey', 'OrderDateKey', 'DueDateKey', 'ShipDateKey', 'CustomerKey', 'PromotionKey', 'CurrencyKey', 'SalesTerritoryKey', 'SalesOrderNumber', 'SalesOrderLineNumber', 'RevisionNumber', 'OrderQuantity', 'UnitPrice', 'ExtendedAmount', 'UnitPriceDiscountPct', 'DiscountAmount', 'ProductStandardCost', 'TotalProductCost', 'SalesAmount', 'TaxAmt', 'Freight', 'CarrierTrackingNumber', 'CustomerPONumber', 'OrderDate', 'DueDate', 'ShipDate']
    customer_cols = ['CustomerKey', 'GeographyKey', 'CustomerAlternateKey', 'Title', 'FirstName', 'MiddleName', 'LastName', 'NameStyle', 'BirthDate', 'MaritalStatus', 'Suffix', 'Gender', 'EmailAddress', 'YearlyIncome']
    promo_cols = ['PromotionKey', 'PromotionAlternateKey', 'EnglishPromotionName']
    date_cols = ['DateKey', 'FullDateAlternateKey', 'DayNumberOfWeek', 'EnglishDayNameOfWeek', 'SpanishDayNameOfWeek', 'FrenchDayNameOfWeek', 'DayNumberOfMonth', 'DayNumberOfYear', 'WeekNumberOfYear', 'EnglishMonthName', 'SpanishMonthName', 'FrenchMonthName', 'MonthNumberOfYear', 'CalendarQuarter', 'CalendarYear']

    # Ambil data dari folder
    fact_sales = load_b2c_csv_bulletproof(os.path.join(data_dir, "FactInternetSales.csv"), fact_sales_cols)
    dim_customer = load_b2c_csv_bulletproof(os.path.join(data_dir, "DimCustomer.csv"), customer_cols)
    dim_promo = load_b2c_csv_bulletproof(os.path.join(data_dir, "DimPromotion.csv"), promo_cols)
    dim_date = load_b2c_csv_bulletproof(os.path.join(data_dir, "DimDate.csv"), date_cols)

    if fact_sales.empty:
        return {"kpi": {}, "demographic_income": [], "promo_performance": [], "monthly_trend": []}

    # ==========================================================
    # 🕵️‍♂️ DETEKSI KOLOM DINAMIS (ANTI KEYERROR)
    # ==========================================================
    # Cari kolom sales amount secara fleksibel
    sales_amount_col = next((c for c in fact_sales.columns if 'salesamount' in c.lower()), None)
    if not sales_amount_col:
        sales_amount_col = fact_sales.columns[18] if len(fact_sales.columns) > 18 else fact_sales.columns[-1]
    fact_sales['SalesAmount'] = pd.to_numeric(fact_sales[sales_amount_col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce').fillna(0)

    # Cari kolom total product cost secara fleksibel
    cost_col = next((c for c in fact_sales.columns if 'productcost' in c.lower() or 'totalproductcost' in c.lower()), None)
    if not cost_col:
        cost_col = fact_sales.columns[17] if len(fact_sales.columns) > 17 else fact_sales.columns[-2]
    fact_sales['TotalProductCost'] = pd.to_numeric(fact_sales[cost_col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce').fillna(0)

    # Cari kolom customer key di tabel fakta dan dimensi
    cust_key_fact = next((c for c in fact_sales.columns if 'customerkey' in c.lower()), fact_sales.columns[4])
    cust_key_dim = next((c for c in dim_customer.columns if 'customerkey' in c.lower()), dim_customer.columns[0])
    fact_sales['CustomerKey'] = pd.to_numeric(fact_sales[cust_key_fact], errors='coerce').fillna(-1).astype(int)
    dim_customer['CustomerKey'] = pd.to_numeric(dim_customer[cust_key_dim], errors='coerce').fillna(-2).astype(int)

    # Cari kolom yearly income secara fleksibel
    income_col = next((c for c in dim_customer.columns if 'income' in c.lower() or 'yearlyincome' in c.lower()), None)
    if income_col:
        dim_customer['YearlyIncome'] = pd.to_numeric(dim_customer[income_col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce').fillna(0)
    else:
        dim_customer['YearlyIncome'] = 0

    # 4. KALKULASI TARGET KPI UTAMA B2C
    total_revenue = float(fact_sales['SalesAmount'].sum())
    total_cost = float(fact_sales['TotalProductCost'].sum())
    total_profit = total_revenue - total_cost
    profit_margin = (total_profit / total_revenue) * 100 if total_revenue > 0 else 0
    total_orders = len(fact_sales)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

    kpi = {
        "total_revenue": round(total_revenue, 2),
        "total_profit": round(total_profit, 2),
        "profit_margin": round(profit_margin, 2),
        "total_orders": int(total_orders),
        "avg_order_value": round(avg_order_value, 2)
    }

    # 5. MODUL ANALYSIS 1: PIE CHART (SEGMENTASI INCOME)
    demographic_income_list = []
    if 'CustomerKey' in fact_sales.columns and 'CustomerKey' in dim_customer.columns and not dim_customer.empty:
        df_cust_sales = pd.merge(fact_sales, dim_customer, on="CustomerKey", how="inner")
        if not df_cust_sales.empty:
            income_bins = [0, 30000, 60000, 90000, 120000, float('inf')]
            income_labels = ['< $30k', '$30k - $60k', '$60k - $90k', '$90k - $120k', '$120k+']
            df_cust_sales['IncomeGroup'] = pd.cut(df_cust_sales['YearlyIncome'], bins=income_bins, labels=income_labels)
            demographic_income = df_cust_sales.groupby('IncomeGroup', observed=False)['SalesAmount'].sum().reset_index()
            demographic_income_list = demographic_income.rename(columns={'SalesAmount': 'TotalSales'}).to_dict(orient='records')

    # 6. MODUL ANALYSIS 2: MARKETING PROMOTION TABLE (TOTAL REVENUE & HARDCODE COMPATIBLE)
    promo_list = []
    promo_key_fact = next((c for c in fact_sales.columns if 'promotionkey' in c.lower()), fact_sales.columns[5] if len(fact_sales.columns) > 5 else None)
    promo_key_dim = next((c for c in dim_promo.columns if 'promotionkey' in c.lower()), dim_promo.columns[0] if not dim_promo.empty else None)
    
    if promo_key_fact and promo_key_dim and not dim_promo.empty:
        fact_sales['PromotionKey'] = pd.to_numeric(fact_sales[promo_key_fact], errors='coerce').fillna(-1).astype(int)
        dim_promo['PromotionKey'] = pd.to_numeric(dim_promo[promo_key_dim], errors='coerce').fillna(-2).astype(int)
        
        df_promo_sales = pd.merge(fact_sales, dim_promo, on="PromotionKey", how="inner")
        if not df_promo_sales.empty:
            promo_name_col = next((c for c in df_promo_sales.columns if 'promotionname' in c.lower() or 'englishpromotionname' in c.lower()), df_promo_sales.columns[-1])
            promo_performance = df_promo_sales.groupby(promo_name_col)['SalesAmount'].sum().reset_index()
            promo_performance = promo_performance.sort_values(by='SalesAmount', ascending=False).head(5)
            promo_performance = promo_performance.rename(columns={promo_name_col: 'EnglishPromotionName', 'SalesAmount': 'TotalSales'})
            promo_performance['DiscountApplied'] = 0
            promo_list = promo_performance.to_dict(orient='records')

    # 7. MODUL ANALYSIS 3: TREN BULANAN BAR CHART
    monthly_list = []
    date_key_fact = next((c for c in fact_sales.columns if 'datekey' in c.lower() or 'orderdatekey' in c.lower()), fact_sales.columns[2])
    date_key_dim = next((c for c in dim_date.columns if 'datekey' in c.lower()), dim_date.columns[0] if not dim_date.empty else None)
    
    if date_key_fact and date_key_dim and not dim_date.empty:
        fact_sales['OrderDateKey'] = pd.to_numeric(fact_sales[date_key_fact], errors='coerce').fillna(-1).astype(int)
        dim_date['DateKey'] = pd.to_numeric(dim_date[date_key_dim], errors='coerce').fillna(-2).astype(int)
        
        df_date_sales = pd.merge(fact_sales, dim_date, left_on="OrderDateKey", right_on="DateKey", how="inner")
        year_col = next((c for c in df_date_sales.columns if 'calendaryear' in c.lower()), None)
        month_num_col = next((c for c in df_date_sales.columns if 'monthnumberofyear' in c.lower()), None)
        month_name_col = next((c for c in df_date_sales.columns if 'englishmonthname' in c.lower()), None)
        
        if year_col and month_num_col and month_name_col:
            monthly_trend = df_date_sales.groupby([year_col, month_num_col, month_name_col])['SalesAmount'].sum().reset_index()
            if not monthly_trend.empty:
                best_year = monthly_trend.groupby(year_col)['SalesAmount'].sum().idxmax()
                df_filtered_year = monthly_trend[monthly_trend[year_col] == best_year].sort_values(by=month_num_col)
                df_filtered_year = df_filtered_year.rename(columns={month_name_col: 'EnglishMonthName', 'SalesAmount': 'Revenue'})
                monthly_list = df_filtered_year.to_dict(orient='records')

    return {
        "kpi": kpi,
        "demographic_income": demographic_income_list,
        "promo_performance": promo_list,
        "monthly_trend": monthly_list
    }