@echo off
title SuriLearn - Servidor Local
echo ========================================================
echo           INICIANDO SURILEARN GAMIFIED APP
echo ========================================================
echo.
cd /d "%~dp0"

echo Abriendo navegador en http://localhost:3000 ...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo Iniciando servidor de desarrollo con Vite...
echo Para detener la aplicacion en cualquier momento, presiona Ctrl + C o cierra esta ventana.
echo.
npm run dev
pause
