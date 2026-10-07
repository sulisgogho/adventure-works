@echo off
echo Starting AdventureWorks Enterprise Control Tower...
cd backend
python -m uvicorn main:app --reload
