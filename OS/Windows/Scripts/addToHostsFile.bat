@echo off
setlocal ENABLEDELAYEDEXPANSION

set NORMALHOSTNAME="127.0.0.1       www.marktplaatstabel.services"
set SSLHOSTNAME="127.0.0.1       ssl.marktplaatstabel.services"

type "%SystemRoot%\system32\drivers\etc\hosts" | find "%NORMALHOSTNAME:"=%" ||echo %NORMALHOSTNAME:"=%>>"%SystemRoot%\system32\drivers\etc\hosts"
type "%SystemRoot%\system32\drivers\etc\hosts" | find "%SSLHOSTNAME:"=%" ||echo %SSLHOSTNAME:"=%>>"%SystemRoot%\system32\drivers\etc\hosts"

