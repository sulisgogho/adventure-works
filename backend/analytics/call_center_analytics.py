import os
import pandas as pd
import numpy as np

def load_call_center_csv(file_path, default_columns):
    """Membaca file CSV FactCallCenter dengan toleransi tinggi terhadap header."""
    try:
        if not os.path.exists(file_path):
            return pd.DataFrame()

        df_check = pd.read_csv(file_path, sep='|', nrows=2, header=None, encoding='latin1')
        
        is_header = False
        if not df_check.empty:
            first_row_samples = df_check.iloc[0].astype(str).tolist()
            is_header = any(any(k in cell.lower() for k in ['key', 'id', 'call', 'wage', 'shift', 'date']) for cell in first_row_samples)
        
        if is_header:
            df = pd.read_csv(file_path, sep='|', encoding='latin1')
            df.columns = df.columns.str.strip()
        else:
            df = pd.read_csv(file_path, sep='|', header=None, encoding='latin1')
            df.columns = [default_columns[i] if i < len(default_columns) else f'Col_{i}' for i in range(len(df.columns))]
            
        df.columns = df.columns.astype(str).str.strip()
        return df
    except Exception as e:
        print(f"🚨 [CALL CENTER ERROR] Gagal membaca {os.path.basename(file_path)}: {str(e)}")
        return pd.DataFrame()

def get_call_center_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    # Skema kolom default FactCallCenter berdasarkan dokumentasi AdventureWorks
    call_center_cols = ['FactCallCenterID', 'DateKey', 'WageType', 'Shift', 'Calls', 'AutomaticResponses', 'Orders', 'IssuesRaised', 'AverageTimePerCall', 'MaximumDelay', 'Date']
    dim_date_cols = ['DateKey', 'FullDateAlternateKey', 'DayNumberOfWeek', 'EnglishDayNameOfWeek', 'SpanishDayNameOfWeek', 'FrenchDayNameOfWeek', 'DayNumberOfMonth', 'DayNumberOfYear', 'WeekNumberOfYear', 'EnglishMonthName', 'SpanishMonthName', 'FrenchMonthName', 'MonthNumberOfYear', 'CalendarQuarter', 'CalendarYear']

    df_cc = load_call_center_csv(os.path.join(data_dir, "FactCallCenter.csv"), call_center_cols)
    df_date = load_call_center_csv(os.path.join(data_dir, "DimDate.csv"), dim_date_cols)

    if df_cc.empty:
        return {"kpi": {}, "shift_performance": [], "monthly_trend": []}

    # ==========================================================
    # DETEKSI KOLOM DINAMIS
    # ==========================================================
    calls_col = next((c for c in df_cc.columns if 'calls' in c.lower()), df_cc.columns[4])
    issues_col = next((c for c in df_cc.columns if 'issuesraised' in c.lower() or 'issues' in c.lower()), df_cc.columns[7])
    avg_time_col = next((c for c in df_cc.columns if 'averagetime' in c.lower() or 'timepercall' in c.lower()), df_cc.columns[8])
    shift_col = next((c for c in df_cc.columns if 'shift' in c.lower()), df_cc.columns[3])
    orders_col = next((c for c in df_cc.columns if 'orders' in c.lower()), df_cc.columns[6])

    # Konversi Tipe Data Numerik Bersih
    df_cc['Calls'] = pd.to_numeric(df_cc[calls_col], errors='coerce').fillna(0).astype(int)
    df_cc['IssuesRaised'] = pd.to_numeric(df_cc[issues_col], errors='coerce').fillna(0).astype(int)
    df_cc['AverageTimePerCall'] = pd.to_numeric(df_cc[avg_time_col], errors='coerce').fillna(0).astype(int)
    df_cc['Orders'] = pd.to_numeric(df_cc[orders_col], errors='coerce').fillna(0).astype(int)

    # 1. HITUNG KPI UTAMA CALL CENTER
    total_calls = int(df_cc['Calls'].sum())
    total_issues = int(df_cc['IssuesRaised'].sum())
    total_orders_via_phone = int(df_cc['Orders'].sum())
    
    # Rata-rata waktu penanganan panggilan (AHT - Average Handling Time) dalam detik
    avg_handling_time = float(df_cc['AverageTimePerCall'].mean()) if not df_cc.empty else 0
    
    # Rasio Konversi Panggilan menjadi Order/Penjualan (%)
    conversion_rate = (total_orders_via_phone / total_calls) * 100 if total_calls > 0 else 0

    kpi = {
        "total_calls": total_calls,
        "total_issues": total_issues,
        "total_orders_via_phone": total_orders_via_phone,
        "avg_handling_time_seconds": round(avg_handling_time, 1),
        "conversion_rate": round(conversion_rate, 2)
    }

    # 2. ANALISIS PERFORMA BERDASARKAN SHIFT KERJA (PIE CHART / BAR)
    df_cc['Shift'] = df_cc[shift_col].astype(str).str.strip()
    shift_perf = df_cc.groupby('Shift').agg(
        TotalCalls=('Calls', 'sum'),
        TotalIssues=('IssuesRaised', 'sum'),
        TotalOrders=('Orders', 'sum')
    ).reset_index().to_dict(orient='records')

    # 3. TREN TELEPON BULANAN (LINE CHART)
    monthly_list = []
    date_key_cc = next((c for c in df_cc.columns if 'datekey' in c.lower()), df_cc.columns[1])
    date_key_dim = next((c for c in df_date.columns if 'datekey' in c.lower()), df_date.columns[0] if not df_date.empty else None)

    if date_key_cc and date_key_dim and not df_date.empty:
        df_cc['DateKey'] = pd.to_numeric(df_cc[date_key_cc], errors='coerce').fillna(-1).astype(int)
        df_date['DateKey'] = pd.to_numeric(df_date[date_key_dim], errors='coerce').fillna(-2).astype(int)
        
        df_merged = pd.merge(df_cc, df_date, on="DateKey", how="inner")
        
        year_col = next((c for c in df_merged.columns if 'calendaryear' in c.lower()), None)
        month_num_col = next((c for c in df_merged.columns if 'monthnumberofyear' in c.lower()), None)
        month_name_col = next((c for c in df_merged.columns if 'englishmonthname' in c.lower()), None)

        if year_col and month_num_col and month_name_col:
            trend = df_merged.groupby([year_col, month_num_col, month_name_col]).agg(
                IncomingCalls=('Calls', 'sum'),
                ResolvedOrders=('Orders', 'sum')
            ).reset_index()
            
            if not trend.empty:
                # Ambil data tahun dengan trafik panggilan tertinggi agar grafik penuh
                best_year = trend.groupby(year_col)['IncomingCalls'].sum().idxmax()
                df_filtered = trend[trend[year_col] == best_year].sort_values(by=month_num_col)
                df_filtered = df_filtered.rename(columns={month_name_col: 'EnglishMonthName'})
                monthly_list = df_filtered.to_dict(orient='records')

    return {
        "kpi": kpi,
        "shift_performance": shift_perf,
        "monthly_trend": monthly_list
    }