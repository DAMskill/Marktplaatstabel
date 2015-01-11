@ECHO OFF
REM *******************************************************************************
REM * Copyright (c) 2014 Ivo van Kamp
REM *
REM * This file is part of Marktplaatstabel.
REM *
REM * Marktplaatstabel is free software: you can redistribute it and/or modify
REM * it under the terms of the GNU General Public License as published by
REM * the Free Software Foundation, either version 3 of the License, or
REM * (at your option) any later version.
REM *
REM * Marktplaatstabel is distributed in the hope that it will be useful,
REM * but WITHOUT ANY WARRANTY; without even the implied warranty of
REM * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
REM * GNU General Public License for more details.
REM *
REM * You should have received a copy of the GNU General Public License
REM * along with this program.  If not, see <http://www.gnu.org/licenses/>.
REM *******************************************************************************

SETLOCAL ENABLEDELAYEDEXPANSION
SET THISDIR=%~dp0

echo.
echo Marktplaatstabel
echo.^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=

SET NODEJSEXEC=node.exe

REM Print intro text to screen
<NUL SET /p=Marktplaatstabel wordt gestart

REM Test 10 times if NodeJS is running.

FOR /L %%i IN (1,1,10) DO (

  CALL :isRunning %NODEJSEXEC%
  SET nodejsIsRunning=!result!

  IF !nodejsIsRunning! EQU 0 (
        "%THISDIR%\RunHiddenConsole.exe" node "%THISDIR%\..\marktplaatstabel.js"
  )

  REM Wait 1/2 a second
  "%THISDIR%\nircmdc" wait 500

  IF !nodejsIsRunning! EQU 1 (
    timeout /t 1 > nul && <NUL SET /p=.
    GOTO :startNodejs
  )

  REM Print a dot
  <NUL SET /p=.

)
GOTO :EOF

:startNodejs
START http://ssl.marktplaatstabel.services/marktplaatstabel
GOTO :EOF

REM :isRunning
REM Seach windows tasklist for executable.
REM Return 0 if not found,
REM return 1 if found.
REM
:isRunning
SETLOCAL
	tasklist /nh /fi "imagename eq %~1" | find /i "%~1" >nul 
	IF ERRORLEVEL 1 (
           SET res=0
	) ELSE (
           SET res=1
	)
ENDLOCAL & SET result=%res%
