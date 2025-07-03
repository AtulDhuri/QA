@echo off
echo Starting Development Environment...
echo.
echo Starting Backend Server...
start "Backend" cmd /k "npm start"
echo.
echo Starting Angular Dev Server...
start "Frontend" cmd /k "cd frontend && npm start"
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:4200
echo.
echo Press any key to exit...
pause