@echo off
setlocal ENABLEDELAYEDEXPANSION

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

SET FULLPATHIEXPLORE="C:\Program Files\Internet Explorer\iexplore.exe"
SET IEXPLOREPARAM="http://localhost/marktplaatstabel"

IF "%1" == "--command" GOTO startOrStopMarktplaatstabel 

:main
        if /I "%1" NEQ "START" (IF /I "%1" NEQ "STOP" (
            echo Start %0 met %0 start,
            echo of %0 stop.
            GOTO:EOF
        ))

	call:batchGotAdmin %1
        GOTO :EOF

:startOrStopMarktplaatstabel 

        echo.
        echo Marktplaatstabel
        echo.^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=^=

	REM Remove old administrative privileges requester VB script
	if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )

	SHIFT

	call:getServiceState MARKTPLAATSTABEL-NGINX
        set NGINXSTATE=%state%

	call:getServiceState MARKTPLAATSTABEL-PHP-CGI
        set PHPSTATE=%state%

        set QUIT=0
        if "%NGINXSTATE%" EQU "DOESNOTEXIST" (
            echo Marktplaatstabel NGINX service niet gevonden.
            set QUIT=1
        )
        if "%PHPSTATE%" EQU "DOESNOTEXIST" (
            echo Marktplaatstabel PHP service niet gevonden.
            set QUIT=1
        )
        if "%QUIT%" EQU "1" (
            echo De Marktplaatstabel services zijn niet geinstalleerd. 
            echo.
            pause
            GOTO:EOF
        )

        if /I "%1" EQU "START" (

            if "%NGINXSTATE%" EQU "STOPPED" (
                net start MARKTPLAATSTABEL-NGINX
            )

            if "%PHPSTATE%" EQU "STOPPED" (
                net start MARKTPLAATSTABEL-PHP-CGI
            )
            echo Marktplaatstabel is gestart

            START "" %FULLPATHIEXPLORE% %IEXPLOREPARAM%
        )

        if /I "%1" EQU "STOP" (

            if "%NGINXSTATE%" EQU "RUNNING" (
                net stop MARKTPLAATSTABEL-NGINX
            )

            if "%PHPSTATE%" EQU "RUNNING" (
                net stop MARKTPLAATSTABEL-PHP-CGI
            )
            echo Marktplaatstabel is gestopt
            echo.
            pause
        )

	GOTO :EOF

REM
REM Function BatchGotAdmin
REM Source: https://sites.google.com/site/eneerge/scripts/batchgotadmin
REM

:batchGotAdmin

	REM  --> Check for permissions
	>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

	REM --> If error flag set, we do not have admin.
	if '%errorlevel%' NEQ '0' (
	    echo Requesting administrative privileges...
	    GOTO UACPrompt
	) else ( GOTO gotAdmin )

	:UACPrompt
	    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
	    echo UAC.ShellExecute "%~s0", "--command %1", "", "runas", 1 >> "%temp%\getadmin.vbs"
	    "%temp%\getadmin.vbs"
	    exit /B

	:gotAdmin
            call %~s0 --command %1
	    GOTO :EOF


:getServiceState

        set state=
        for /F "tokens=3 delims=: " %%R in ('sc query "%1" ^| findstr "The specified service does not exist as an installed service."') do (
            set state=DOESNOTEXIST
        )
        if "%state%" EQU "" (
            for /F "tokens=3 delims=: " %%R in ('sc query "%1" ^| findstr "        STATE"') do (
                set state=%%R
            )
        )
