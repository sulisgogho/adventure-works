import os
import pandas as pd
import numpy as np

def load_hr_csv_safe(file_path, default_columns):
    """Membaca file CSV DimEmployee dengan toleransi tinggi terhadap header."""
    try:
        if not os.path.exists(file_path):
            return pd.DataFrame()

        df_check = pd.read_csv(file_path, sep='|', nrows=2, header=None, encoding='latin1')
        
        is_header = False
        if not df_check.empty:
            first_row_samples = df_check.iloc[0].astype(str).tolist()
            is_header = any(any(k in cell.lower() for k in ['employee', 'key', 'login', 'title', 'department', 'status']) for cell in first_row_samples)
        
        if is_header:
            df = pd.read_csv(file_path, sep='|', encoding='latin1')
            df.columns = df.columns.str.strip()
        else:
            df = pd.read_csv(file_path, sep='|', header=None, encoding='latin1')
            df.columns = [default_columns[i] if i < len(default_columns) else f'Col_{i}' for i in range(len(df.columns))]
            
        df.columns = df.columns.astype(str).str.strip()
        return df
    except Exception as e:
        print(f"🚨 [HR ERROR] Gagal membaca {os.path.basename(file_path)}: {str(e)}")
        return pd.DataFrame()

def get_hr_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    # Skema kolom default DimEmployee berdasarkan spesifikasi data warehouse AdventureWorks
    hr_cols = ['EmployeeKey', 'ParentEmployeeKey', 'EmployeeNationalIDAlternateKey', 'ParentEmployeeNationalIDAlternateKey', 'SalesTerritoryKey', 'FirstName', 'LastName', 'MiddleName', 'NameStyle', 'Title', 'HireDate', 'BirthDate', 'LoginID', 'EmailAddress', 'Phone', 'MaritalStatus', 'EmergencyContactName', 'EmergencyContactPhone', 'SalariedFlag', 'Gender', 'PayFrequency', 'BaseRate', 'VacationHours', 'SickLeaveHours', 'CurrentFlag', 'SalesPersonFlag', 'DepartmentName']

    df_emp = load_hr_csv_safe(os.path.join(data_dir, "DimEmployee.csv"), hr_cols)

    if df_emp.empty:
        return {"kpi": {}, "department_distribution": [], "gender_leave_analysis": []}

    # ==========================================================
    # DETEKSI KOLOM DINAMIS
    # ==========================================================
    dept_col = next((c for c in df_emp.columns if 'department' in c.lower()), None)
    if not dept_col:
        dept_col = df_emp.columns[-1] # Fallback kolom terakhir

    vacation_col = next((c for c in df_emp.columns if 'vacation' in c.lower()), None)
    sick_col = next((c for c in df_emp.columns if 'sick' in c.lower()), None)
    gender_col = next((c for c in df_emp.columns if 'gender' in c.lower()), None)
    status_col = next((c for c in df_emp.columns if 'currentflag' in c.lower() or 'status' in c.lower()), None)

    # Standardisasi Data Teks dan Numerik
    df_emp['DepartmentName'] = df_emp[dept_col].astype(str).str.strip()
    df_emp['VacationHours'] = pd.to_numeric(df_emp[vacation_col], errors='coerce').fillna(0).astype(int)
    df_emp['SickLeaveHours'] = pd.to_numeric(df_emp[sick_col], errors='coerce').fillna(0).astype(int)
    df_emp['Gender'] = df_emp[gender_col].astype(str).str.strip().str.upper() if gender_col else "M"

    # 1. HITUNG KPI UTAMA OPERASIONAL HRD
    total_employees = len(df_emp)
    
    # Karyawan aktif (biasanya dinilai dari CurrentFlag == 1 atau True)
    if status_col:
        active_employees = len(df_emp[df_emp[status_col].astype(str).str.contains('1|True|Y', regex=True)])
    else:
        active_employees = total_employees

    avg_vacation_hours = float(df_emp['VacationHours'].mean())
    avg_sick_leave_hours = float(df_emp['SickLeaveHours'].mean())

    kpi = {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "avg_vacation_hours": round(avg_vacation_hours, 1),
        "avg_sick_leave_hours": round(avg_sick_leave_hours, 1)
    }

    # 2. SEBARAN KARYAWAN PER DEPARTEMEN (BAR CHART)
    dept_dist = df_emp.groupby('DepartmentName').agg(
        Headcount=('EmployeeKey', 'count'),
        TotalVacation=('VacationHours', 'sum')
    ).reset_index().sort_values(by='Headcount', ascending=False).to_dict(orient='records')

    # 3. ANALISIS ABSENSI & CUTI BERDASARKAN GENDER (COMPOSED CHART)
    gender_analysis = df_emp.groupby('Gender').agg(
        AvgVacation=('VacationHours', 'mean'),
        AvgSickLeave=('SickLeaveHours', 'mean'),
        Count=('EmployeeKey', 'count')
    ).reset_index()
    
    gender_analysis['AvgVacation'] = gender_analysis['AvgVacation'].round(1)
    gender_analysis['AvgSickLeave'] = gender_analysis['AvgSickLeave'].round(1)
    
    # Mapping label agar cantik di frontend
    gender_analysis['GenderLabel'] = gender_analysis['Gender'].map({'M': 'Male / Pria', 'F': 'Female / Wanita'}).fillna('Other')
    gender_list = gender_analysis.to_dict(orient='records')

    return {
        "kpi": kpi,
        "department_distribution": dept_dist,
        "gender_leave_analysis": gender_list
    }