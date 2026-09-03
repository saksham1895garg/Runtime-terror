import os
from supabase import create_client
from app.core.config import settings

db = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

print("--- prediction_runs ---")
res = db.table("prediction_runs").select("*").eq("status", "COMPLETED").order("created_at", desc=True).limit(1).execute()
print(res.data)

print("\n--- risk_predictions ---")
res = db.table("risk_predictions").select("*").eq("grid_code", "GNG-000026").order("generated_at", desc=True).limit(1).execute()
print(res.data)

print("\n--- prediction_job_events ---")
res = db.table("prediction_job_events").select("*").order("created_at", desc=True).limit(2).execute()
print(res.data)
