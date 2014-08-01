@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

echo Marktplaatstabel
echo ================

taskkill /f /IM php-cgi.exe >nul 2>&1 && SET res1=1
taskkill /f /IM nginx.exe >nul 2>&1 && SET res2=1

if !res1! EQU 1 (
   IF !res2! EQU 1 (
      echo Marktplaatstabel is succesvol afgesloten
   )
)

if !res1! EQU 0 (
   echo PHP kon niet worden afgesloten
)
if !res2! EQU 0 (
   echo NGINX kon niet worden afgesloten
)

echo.
pause
