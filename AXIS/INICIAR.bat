@echo off
chcp 65001 >nul
cls
echo.
echo  ============================================================
echo    AXIS - THE EXECUTION OS v4.1
echo    Mission Control for Modern Teams
echo  ============================================================
echo.

cd /d "%~dp0"

REM --- Verificar Node.js ---
where node >nul 2>&1
IF errorlevel 1 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH.
    echo         Descarga desde: https://nodejs.org  ^(version 18 o superior^)
    echo.
    pause
    exit /b 1
)

REM --- Verificar instalacion intacta ---
REM Si node_modules existe pero falta vite, la instalacion esta corrupta -^> reinstalar
IF EXIST node_modules (
    IF NOT EXIST "node_modules\.bin\vite.cmd" (
        echo [WARN] node_modules incompleto detectado. Limpiando para reinstalar...
        rmdir /s /q node_modules
        IF EXIST node_modules (
            echo [ERROR] No pude eliminar node_modules. Cierra cualquier editor abierto y reintenta.
            pause
            exit /b 1
        )
    )
)

IF NOT EXIST node_modules (
    echo [SETUP] Instalando dependencias por primera vez...
    echo         Esto puede tardar 1-3 minutos.
    echo.
    call npm install --no-audit --no-fund
    IF errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias.
        echo         Revisa los mensajes arriba.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas.
    echo.
)

REM --- Verificar que vite quedo disponible ---
IF NOT EXIST "node_modules\.bin\vite.cmd" (
    echo [ERROR] vite no se instalo correctamente. Ejecuta manualmente:
    echo         npm install
    pause
    exit /b 1
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
echo  [INFO] Si la ventana se cierra sola, abre cmd.exe en esta carpeta
echo         y ejecuta: npm run dev   (asi ves el error completo)
echo.
call npm run dev

REM --- Si npm run dev sale con error, mantener ventana abierta ---
IF errorlevel 1 (
    echo.
    echo  ============================================================
    echo    [ERROR] El servidor termino con error.
    echo            Revisa los mensajes arriba.
    echo  ============================================================
    pause
    exit /b 1
)

echo.
echo  [INFO] Servidor detenido.
pause
