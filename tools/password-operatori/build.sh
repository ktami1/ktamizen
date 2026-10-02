#!/bin/sh
# Compilazione da Linux/macOS con Mono, CONTRO LE API DI .NET FRAMEWORK 4.0:
# cosi' l'exe usa solo metodi che esistono davvero su Windows (Mono ne ha alcuni in piu').
set -e
cd "$(dirname "$0")"
R=/usr/lib/mono/4.0-api
mcs -noconfig -nostdlib -langversion:5 -target:winexe -optimize+ -out:PasswordOperatori.exe -win32icon:icon.ico \
  -r:$R/mscorlib.dll -r:$R/System.dll -r:$R/System.Core.dll -r:$R/System.Drawing.dll -r:$R/System.Windows.Forms.dll \
  -resource:fonts/Roboto-Regular.ttf,Roboto-Regular.ttf \
  -resource:fonts/Roboto-Medium.ttf,Roboto-Medium.ttf \
  -resource:fonts/Roboto-Bold.ttf,Roboto-Bold.ttf \
  PasswordOperatori.cs Security.cs AdminForms.cs
sha256sum PasswordOperatori.exe
