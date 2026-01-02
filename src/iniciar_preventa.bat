@echo off
TITLE Servidor Preventa (Puerto 8080)
COLOR 0B

echo =========================================
echo   INICIANDO APP PREVENTA MOVIL
echo =========================================
echo.

:: Forzamos el puerto 8080 para no chocar con Streamlit (8501)
:: --host permite que entres desde el celular por WiFi
call npm run dev -- --port 8080 --host

pause