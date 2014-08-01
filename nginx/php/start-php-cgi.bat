@ECHO OFF
ECHO Starting PHP FastCGI...
set PATH=C:\c:\wamp\www\php;%PATH%
RunHiddenConsole.exe php-cgi.exe -b 127.0.0.1:9123
