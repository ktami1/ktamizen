@echo off
rem Compila MctlViewer.exe con il compilatore C# gia' presente in Windows (.NET Framework 4.x).
rem Nessuna installazione richiesta.
setlocal
set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" (
  echo .NET Framework 4.x non trovato.
  pause
  exit /b 1
)
cd /d "%~dp0"
"%CSC%" /nologo /target:winexe /optimize+ /out:MctlViewer.exe /r:System.Windows.Forms.dll /r:System.Drawing.dll MctlViewer.cs
if errorlevel 1 (
  echo Compilazione fallita.
  pause
  exit /b 1
)
echo Creato MctlViewer.exe
pause
