@echo off
setlocal
cd /d "%~dp0"

py -m pip install --upgrade pyinstaller playwright requests beautifulsoup4
if errorlevel 1 exit /b 1

set PLAYWRIGHT_BROWSERS_PATH=0
py -m playwright install chromium
if errorlevel 1 exit /b 1

py -m PyInstaller --clean --noconsole --onefile --name ColetorGR coletor_multimodelo_api.py
if errorlevel 1 exit /b 1

echo.
echo Executavel criado em: %CD%\dist\ColetorGR.exe
echo Copie ColetorGR.exe e instalar_coletor.bat para o computador do cliente.
pause
