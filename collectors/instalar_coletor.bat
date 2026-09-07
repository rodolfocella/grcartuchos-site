@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Instalador do Coletor GR Cartuchos

set "PASTA=C:\GRColetor"
set "ORIGEM=%~dp0ColetorGR.exe"
set "DESTINO=%PASTA%\ColetorGR.exe"
set "CONFIG=%PASTA%\config_coletor.json"

echo ==================================================
echo   INSTALADOR DO COLETOR - GR CARTUCHOS
echo ==================================================
echo.

if not exist "%ORIGEM%" (
  echo ERRO: ColetorGR.exe nao foi encontrado ao lado deste instalador.
  echo.
  pause
  exit /b 1
)

echo Modelos disponiveis:
echo   1 - Brother Linha Antiga
echo   2 - Brother Linha Nova
echo   3 - Canon 1643
echo   4 - Ricoh
echo   5 - Brother 2540 / 2700 / 2520
echo   6 - Epson EcoTank
echo   7 - Canon GX6000 / GX Series
echo.

set /p "TIPO=Tipo da impressora (1 a 7): "
set /p "MODELO=Modelo exato da impressora: "
set /p "IP=IP local da impressora: "
set /p "CLIENTE=Nome exato do cliente no painel: "
set /p "TOKEN=Token da API fornecido pela GR Cartuchos: "

set "SENHA_CANON="
if "%TIPO%"=="7" set /p "SENHA_CANON=Senha de administrador da Canon: "

if "%TIPO%"=="" goto :dados_invalidos
if "%MODELO%"=="" goto :dados_invalidos
if "%IP%"=="" goto :dados_invalidos
if "%CLIENTE%"=="" goto :dados_invalidos
if "%TOKEN%"=="" goto :dados_invalidos

if not exist "%PASTA%" mkdir "%PASTA%"
if errorlevel 1 goto :erro_permissao

taskkill /IM ColetorGR.exe /F >nul 2>&1

if exist "%CONFIG%" copy /Y "%CONFIG%" "%CONFIG%.bak" >nul
copy /Y "%ORIGEM%" "%DESTINO%" >nul
if errorlevel 1 goto :erro_permissao

set "GR_TIPO=%TIPO%"
set "GR_MODELO=%MODELO%"
set "GR_IP=%IP%"
set "GR_CLIENTE=%CLIENTE%"
set "GR_TOKEN=%TOKEN%"
set "GR_SENHA_CANON=%SENHA_CANON%"
set "GR_CONFIG=%CONFIG%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$config = [ordered]@{ TIPO=$env:GR_TIPO; MODELO=$env:GR_MODELO; IP=$env:GR_IP; CLIENTE=$env:GR_CLIENTE; API_TOKEN=$env:GR_TOKEN; SENHA_CANON=$env:GR_SENHA_CANON }; $config | ConvertTo-Json | Set-Content -LiteralPath $env:GR_CONFIG -Encoding UTF8"
if errorlevel 1 goto :erro_config

set "GR_EXE=%DESTINO%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$startup=[Environment]::GetFolderPath('Startup'); $atalho=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $startup 'Coletor GR Cartuchos.lnk')); $atalho.TargetPath=$env:GR_EXE; $atalho.WorkingDirectory=[IO.Path]::GetDirectoryName($env:GR_EXE); $atalho.Save()"
if errorlevel 1 goto :erro_atalho

start "" "%DESTINO%"

echo.
echo Instalacao concluida com sucesso.
echo Pasta: %PASTA%
echo O coletor iniciara automaticamente com o Windows.
echo.
pause
exit /b 0

:dados_invalidos
echo.
echo ERRO: Todos os campos obrigatorios devem ser preenchidos.
pause
exit /b 1

:erro_permissao
echo.
echo ERRO: Nao foi possivel gravar em %PASTA%.
echo Clique com o botao direito no instalador e escolha Executar como administrador.
pause
exit /b 1

:erro_config
echo.
echo ERRO: Nao foi possivel criar o arquivo de configuracao.
pause
exit /b 1

:erro_atalho
echo.
echo ERRO: Nao foi possivel adicionar o coletor a Inicializacao do Windows.
pause
exit /b 1
