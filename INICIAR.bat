@echo off
chcp 65001 >nul
cls
echo.
echo  ============================================================
echo    AXIS - MISSION CONTROL v3.0.0
echo    Mission Control for Modern Teams
echo  ============================================================
echo.

cd /d "%~dp0"

IF NOT EXIST node_modules (
    echo [SETUP] Instalando dependencias por primera vez...
    echo         Esto puede tardar 1-2 minutos.
    echo.
    call npm install
    IF errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion. Verifica que tienes Node.js 18+ instalado.
        echo         Descarga: https://nodejs.org
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas.
    echo.
)

echo [BOOT] Iniciando servidor de desarrollo...
echo.
echo  ============================================================
echo    URL:       http://localhost:5173
echo    Director:  coronel / nexus2024
echo    Operators: vega/a01, ramos/a02, torres/a03 ... luna/a11
echo  ============================================================
echo.
echo  [INFO] Para detener el servidor: Ctrl+C
echo.
call npm run dev
