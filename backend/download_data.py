import os
import requests

# 1. Tentukan folder tujuan (backend/data)
target_folder = "data"
os.makedirs(target_folder, exist_ok=True)

# 2. URL Dasar (Base URL) untuk file mentah (raw) dari GitHub Microsoft
base_url = "https://raw.githubusercontent.com/microsoft/sql-server-samples/master/samples/databases/adventure-works/data-warehouse-install-script/"

# 3. Daftar 8 file CSV spesifik yang kita butuhkan untuk Sales, Logistik, & PPIC
files_to_download = [
     "DatabaseLog.csv",
    "DimAccount.csv",
    "DimCurrency.csv",
    "DimCustomer.csv",
    "DimDate.csv",
    "DimDepartmentGroup.csv",
    "DimEmployee.csv",
    "DimGeography.csv",
    "DimOrganization.csv",
    "DimProduct.csv",
    "DimProductCategory.csv",
    "DimProductSubcategory.csv",
    "DimPromotion.csv",
    "DimReseller.csv",
    "DimSalesReason.csv",
    "DimSalesTerritory.csv",
    "DimScenario.csv",
    "FactAdditionalInternationalProductDescription.csv",
    "FactCallCenter.csv",
    "FactCurrencyRate.csv",
    "FactFinance.csv",
    "FactInternetSales.csv",
    "FactInternetSalesReason.csv",
    "FactProductInventory.csv",
    "FactResellerSales.csv",
    "FactSalesQuota.csv",
    "FactSurveyResponse.csv",
    "NewFactCurrencyRate.csv",
    "ProspectiveBuyer.csv",
    "sysdiagrams.csv"
]

print("==================================================")
print("STARTING DATA INGESTION: ADVENTUREWORKS DW CSV")
print("==================================================")

success_count = 0

for file_name in files_to_download:
    full_url = base_url + file_name
    print(f"Mengunduh {file_name}...", end="", flush=True)
    
    try:
        # Melakukan HTTP Request untuk mengambil file
        response = requests.get(full_url, timeout=30)
        
        # Jika koneksi sukses (Status Code 200)
        if response.status_code == 200:
            file_path = os.path.join(target_folder, file_name)
            
            # Simpan file ke dalam folder data/
            with open(file_path, "wb") as f:
                f.write(response.content)
                
            print(" [SUKSES]")
            success_count += 1
        else:
            print(f" [GAGAL] - Status Code: {response.status_code}")
            
    except Exception as e:
        print(f" [ERROR] - {str(e)}")

print("==================================================")
print(f"PROSES SELESAI: {success_count} dari {len(files_to_download)} file berhasil diamankan.")
print(f"Silakan cek folder: '{os.path.abspath(target_folder)}'")
print("==================================================")