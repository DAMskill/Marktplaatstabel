@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

echo Marktplaatstabel
echo ================

SET PROGRAM=Marktplaatstabel

REM Test if removing 64 from the PROCESSOR_ARCHITECTURE 
REM environment variable is possible.
if %PROCESSOR_ARCHITECTURE:64=%==%PROCESSOR_ARCHITECTURE% (
   REM Processor is not 64 bit capable
   SET PROGFILES="%ProgramFiles%"
) ELSE (
   REM Processor is 64 bit capable
   SET PROGFILES="%ProgramFiles(x86)%"
)

SET DEFAULTDIRNAME="!PROGFILES:"=!\!PROGRAM!"

SET PHPCGIEXEC=php-cgi.exe
SET NGINXEXEC=nginx.exe
SET HIDDENCONSOLEEXEC=RunHiddenConsole.exe

SET FULLPATHPHPCGI="!DEFAULTDIRNAME:"=!\php\%PHPCGIEXEC%"
SET PHPCGIPARAM=-c "!DEFAULTDIRNAME:"=!\php\php.ini" -b 127.0.0.1:9123
SET FULLPATHNGINX="!DEFAULTDIRNAME:"=!\%NGINXEXEC%"
SET FULLPATHHIDDENCONSOLE="!DEFAULTDIRNAME:"=!\%HIDDENCONSOLEEXEC%"

SET FULLPATHIEXPLORE="C:\Program Files\Internet Explorer\iexplore.exe"
SET IEXPLOREPARAM="http://localhost/marktplaatstabel"

REM Print intro text to screen
<NUL SET /p=Marktplaatstabel wordt gestart

REM Test 10 times if PHP and NGINX are running.
REM If they are not running try to start them.
REM If they are running start Internet Explorer.

FOR /L %%i IN (1,1,10) DO (

  REM Print a dot every second until all programs have started successfully.
  <NUL SET /p=.

  CALL :isRunning %NGINXEXEC%
  SET nginxIsRunning=!result!

  CALL :isRunning %PHPCGIEXEC%
  SET phpCgiIsRunning=!result!

  IF !phpCgiIsRunning! EQU 0 (
	START "" !FULLPATHHIDDENCONSOLE! !FULLPATHPHPCGI! !PHPCGIPARAM!
  )

  IF !nginxIsRunning! EQU 0 (
	START "" !FULLPATHNGINX!
  )

  REM Wait a second
  timeout /t 1 > nul

  IF !phpCgiIsRunning! EQU 1 (
	IF !nginxIsRunning! EQU 1 (
		timeout /t 1 > nul && <NUL SET /p=.
		timeout /t 1 > nul && <NUL SET /p=.
		GOTO :startIExplore
	)
  )
)
GOTO :EOF

:startIExplore
START "" %FULLPATHIEXPLORE% %IEXPLOREPARAM%
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

