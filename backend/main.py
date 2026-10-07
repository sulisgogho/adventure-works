import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import ketiga fungsi analisis yang sudah sukses kita buat
from analytics.sales_analytics import get_all_sales_analysis
from analytics.logistics_analytics import get_all_logistics_analysis
from analytics.ppic_analytics import get_all_ppic_analysis
from analytics.b2c_analytics import get_b2c_analytics_data
from analytics.call_center_analytics import get_call_center_data
from analytics.sentiment_analytics import get_sentiment_data
from analytics.finance_analytics import get_finance_data
from analytics.hr_analytics import get_hr_data
from analytics.territory_analytics import get_territory_data
from analytics.promotion_analytics import get_promotion_data

# 1. Inisialisasi Aplikasi FastAPI
app = FastAPI(
    title="AdventureWorks Enterprise Control Tower API",
    description="Backend API untuk menyuplai data Dashboard Sales, Logistik, dan PPIC",
    version="1.0.0"
)

# 2. Konfigurasi Keamanan CORS (Agar bisa ditembak oleh React Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Di fase development, kita izinkan semua origin mengakses API ini
    allow_credentials=True,
    allow_methods=["*"], # Mengizinkan semua method (GET, POST, dll)
    allow_headers=["*"], # Mengizinkan semua HTTP Headers
)

# ==========================================================
# ROUTING JALUR API (ENDPOINTS)
# ==========================================================

@app.get("/api")
def read_root():
    return {"status": "Online", "message": "Welcome to AdventureWorks Control Tower API"}

@app.get("/api/sales")
def get_sales_endpoints():
    """Mengembalikan data analisis komersial, portofolio produk, diskon, dan wilayah pasar."""
    return get_all_sales_analysis()

@app.get("/api/logistics")
def get_logistics_endpoints():
    """Mengembalikan data performa pengiriman OTD, lead time internal, dan ongkir."""
    return get_all_logistics_analysis()

@app.get("/api/ppic")
def get_ppic_endpoints():
    """Mengembalikan data menara pengawas stok gudang, alert item kritis, dan matriks ABC-XYZ."""
    return get_all_ppic_analysis()

@app.get("/api/analytics/b2c")
def b2c_analytics():
    try:
        data = get_b2c_analytics_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/analytics/callcenter")
def call_center_analytics():
    try:
        data = get_call_center_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/analytics/sentiment")
def sentiment_analytics():
    try:
        data = get_sentiment_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/analytics/finance")
def finance_analytics():
    try:
        data = get_finance_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/analytics/hr")
def hr_analytics():
    try:
        data = get_hr_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/analytics/territory")
def territory_analytics():
    try:
        data = get_territory_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/analytics/promotion")
def promotion_analytics():
    try:
        data = get_promotion_data()
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================================
# SERVE FRONTEND REACT (JADIKAN SATU)
# ==========================================================
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.isdir(frontend_dist):
    # Serve file statik (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    # Catch-all route untuk menangani React Router dan fallback ke index.html
    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        file_path = os.path.join(frontend_dist, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        return {"message": "Frontend index.html not found."}