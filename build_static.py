import os
import json
import sys

# Tambahkan path ke backend agar bisa import fungsi analytics
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from backend.analytics.sales_analytics import get_all_sales_analysis
from backend.analytics.logistics_analytics import get_all_logistics_analysis
from backend.analytics.ppic_analytics import get_all_ppic_analysis
from backend.analytics.b2c_analytics import get_b2c_analytics_data
from backend.analytics.call_center_analytics import get_call_center_data
from backend.analytics.sentiment_analytics import get_sentiment_data
from backend.analytics.finance_analytics import get_finance_data
from backend.analytics.hr_analytics import get_hr_data
from backend.analytics.territory_analytics import get_territory_data
from backend.analytics.promotion_analytics import get_promotion_data

# Mapping folder output
output_dir = os.path.join(os.path.dirname(__file__), "frontend", "public", "api")
os.makedirs(output_dir, exist_ok=True)
os.makedirs(os.path.join(output_dir, "analytics"), exist_ok=True)

# Helper function untuk menyimpan JSON
def save_json(data, filename):
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"Saved: {filepath}")

if __name__ == "__main__":
    print("Mengekstrak data dari Pandas menjadi Static JSON...")
    
    save_json(get_all_sales_analysis(), "sales.json")
    save_json(get_all_logistics_analysis(), "logistics.json")
    save_json(get_all_ppic_analysis(), "ppic.json")
    
    save_json({"status": "success", "data": get_b2c_analytics_data()}, "analytics/b2c.json")
    save_json({"status": "success", "data": get_call_center_data()}, "analytics/callcenter.json")
    save_json({"status": "success", "data": get_sentiment_data()}, "analytics/sentiment.json")
    save_json({"status": "success", "data": get_finance_data()}, "analytics/finance.json")
    save_json({"status": "success", "data": get_hr_data()}, "analytics/hr.json")
    save_json({"status": "success", "data": get_territory_data()}, "analytics/territory.json")
    save_json({"status": "success", "data": get_promotion_data()}, "analytics/promotion.json")
    
    print("Selesai! Data statis siap di-hosting di Vercel.")
