@echo off
echo 正在关闭旧的后端进程...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend-api*" 2>nul
timeout /t 2 /nobreak >nul

echo 正在启动后端服务...
start "SmartCampus-Backend" cmd /k "npm start"

echo 后端服务已启动！
pause
