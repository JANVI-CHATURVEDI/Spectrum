@echo off
echo ========================================
echo   Starting SwachDrishti Platform...
echo ========================================

start "SwachDrishti Backend (Django)" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python manage.py runserver 127.0.0.1:8000"
start "SwachDrishti Frontend (React)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend:  http://127.0.0.1:8000/api/
echo Frontend: http://localhost:3000
