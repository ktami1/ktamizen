@echo off
rem Compila PasswordOperatori.exe con il compilatore C# gia' presente in Windows (.NET Framework 4.x).
rem Nessuna installazione richiesta. Il font Roboto e l'icona vengono incorporati nell'exe.
rem Dopo la compilazione stampa l'impronta SHA-256 dell'exe da comunicare ai clienti.
setlocal
set CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe
if not exist "%CSC%" set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC%" (
  echo .NET Framework 4.x non trovato.
  pause
  exit /b 1
)
cd /d "%~dp0"
"%CSC%" /nologo /target:winexe /optimize+ /out:PasswordOperatori.exe /win32icon:icon.ico ^
  /r:System.Windows.Forms.dll /r:System.Drawing.dll ^
  /resource:fonts\Roboto-Regular.ttf,Roboto-Regular.ttf ^
  /resource:fonts\Roboto-Medium.ttf,Roboto-Medium.ttf ^
  /resource:fonts\Roboto-Bold.ttf,Roboto-Bold.ttf ^
  PasswordOperatori.cs Security.cs AdminForms.cs
if errorlevel 1 (
  echo Compilazione fallita.
  pause
  exit /b 1
)
echo Creato PasswordOperatori.exe
certutil -hashfile PasswordOperatori.exe SHA256
pause
