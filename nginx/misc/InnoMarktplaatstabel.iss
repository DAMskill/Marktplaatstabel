; -- InnoMarktplaatstabel.iss --

[Setup]
AppName=Marktplaatstabel
AppVersion=1.3.9.1
DefaultDirName={pf}\Marktplaatstabel
DefaultGroupName=Marktplaatstabel
UninstallDisplayIcon={app}\images\marktplaatstabel.ico
SetupIconFile="..\images\marktplaatstabel.ico"
WizardImageFile="..\images\WizModernImage.bmp"
PrivilegesRequired=admin

[Languages]
Name: "nl"; MessagesFile: "compiler:Languages\Dutch.isl"

[Dirs]
; Responsive File Manager file location
Name: "{commondocs}\Marktplaats-tabel"
Name: "{commondocs}\Marktplaats-tabel\afbeeldingen"
; Responsive File Manager picture thumbnails location
Name: "{commondocs}\Marktplaats-tabel_thumbs"

[Files]
DestDir: {app}; Source: ..\*; Excludes: "*.iss, *.log, *.swp, \images\WizModernImage.bmp, contrib, Output, Visual C++ Redistributable for Visual Studio"; Flags: recursesubdirs createallsubdirs 
Source: "..\Excel files\Voorbeeldtabel.xlsm"; DestDir: {commondocs}\Marktplaats-tabel;
Source: "..\images\logo.jpg"; DestDir: {commondocs}\Marktplaats-tabel\afbeeldingen;
Source: "..\images\screenshot*.jpg"; DestDir: {commondocs}\Marktplaats-tabel\afbeeldingen;

;The Visual C++ Redistributable Packages install runtime components that are required to run C++ applications built with Visual Studio.
Source: "..\Visual C++ Redistributable for Visual Studio\vcredist_2010_x86.exe"; DestDir: {tmp}; Flags: deleteafterinstall
Source: "..\Visual C++ Redistributable for Visual Studio\vcredist_2012_x86.exe"; DestDir: {tmp}; Flags: deleteafterinstall

[Registry]
;Add location of Visual C++ DLL libraries to path. PHP requires MSVCR110.DLL.
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};C:\Windows\SysWow64"; Check: NeedsAddPath('C:\Windows\SysWow64')

[Icons]
Name: "{group}\Marktplaatstabel Starten"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{group}\Marktplaatstabel Stoppen"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{group}\Deinstalleer Marktplaatstabel"; Filename: "{uninstallexe}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Starten"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Stoppen"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"

[Run]
Filename: {app}\misc\CertMgr.exe; Parameters: "-add -all -c server.crt -s -r localmachine root"; Flags: waituntilterminated runhidden;
Filename: {app}\start.bat; Description: {cm:LaunchProgram,Marktplaatstabel}; Flags: postinstall;

Filename: "{tmp}\vcredist_2010_x86.exe"; Check: VCRedist2010NeedsInstall86; Parameters: "/passive /norestart"; StatusMsg: Starting installation of {code:GetVCRedist2010Text}...
Filename: "{tmp}\vcredist_2012_x86.exe"; Check: VCRedist2012NeedsInstall86; Parameters: "/passive /norestart"; StatusMsg: Starting installation of {code:GetVCRedist2012Text}...

Filename: {app}\misc\nssm.exe; Parameters: "install MARKTPLAATSTABEL-PHP-CGI ""{app}\php\php-cgi.exe""  """"-b 127.0.0.1:9123 -c \""{app}\php\php.ini\"" """" "; Flags: runhidden
Filename: {app}\misc\nssm.exe; Parameters: "install MARKTPLAATSTABEL-NGINX ""{app}\nginx.exe"" "; Flags: runhidden
Filename: {app}\misc\nssm.exe; Parameters: "set MARKTPLAATSTABEL-PHP-CGI Start SERVICE_DEMAND_START"; Flags: runhidden
Filename: {app}\misc\nssm.exe; Parameters: "set MARKTPLAATSTABEL-NGINX Start SERVICE_DEMAND_START"; Flags: runhidden

;Create folder shortcut in C:\Users\{username}\Links to C:\Users\Public\Documents\Marktplaats-tabel\
Filename: {app}\misc\nircmdc.exe; Parameters: "shortcut ""{commondocs}\Marktplaats-tabel"" ""{sd}\Users\{username}\Links\"" ""Marktplaats-tabel"" """" ""{app}\images\marktplaatstabel.ico"" 0 "; Flags: runhidden

[UninstallRun]
Filename: {app}\misc\nssm.exe; Parameters: "stop MARKTPLAATSTABEL-PHP-CGI"; Flags: runhidden
Filename: {app}\misc\nssm.exe; Parameters: "stop MARKTPLAATSTABEL-NGINX"; Flags: runhidden
Filename: {app}\misc\nssm.exe; Parameters: "remove MARKTPLAATSTABEL-PHP-CGI confirm"; Flags: runhidden
Filename: {app}\misc\nssm.exe; Parameters: "remove MARKTPLAATSTABEL-NGINX confirm"; Flags: runhidden
Filename: {app}\misc\CertMgr.exe; Parameters: "-del -all -c server.crt -s -r localmachine root"; Flags: runhidden

[UninstallDelete]
Type: files; Name: "{app}\logs\access.log"
Type: files; Name: "{app}\logs\error.log"
Type: files; Name: "{app}\logs\nginx.pid"
Type: files; Name: "{app}\marktplaatstabel\php_errors.log"
Type: files; Name: "{app}\marktplaatstabel\php\php_errors.log"
Type: files; Name: "{commondocs}\Marktplaats-tabel\afbeeldingen\logo.jpg"
Type: files; Name: "{commondocs}\Marktplaats-tabel\afbeeldingen\screenshot1.jpg"
Type: files; Name: "{commondocs}\Marktplaats-tabel\afbeeldingen\screenshot2.jpg"
Type: files; Name: "{commondocs}\Marktplaats-tabel\afbeeldingen\screenshot3.jpg"
Type: files; Name: "{sd}\Users\{username}\Links\Marktplaats-tabel.lnk"

Type: dirifempty; Name: "{commondocs}\Marktplaats-tabel\afbeeldingen"
Type: dirifempty; Name: "{commondocs}\Marktplaats-tabel"
Type: dirifempty; Name: "{commondocs}\Marktplaats-tabel_thumbs\afbeeldingen"
Type: dirifempty; Name: "{commondocs}\Marktplaats-tabel_thumbs\Pictures"
Type: dirifempty; Name: "{commondocs}\Marktplaats-tabel_thumbs"


[CustomMessages]
; See example: http://fb2epub.googlecode.com/svn/trunk/Fb2ePubSetup/scripts/products/vcredist2012.iss
nl.vcredist2012_title=Visual C++ Redistributable for Visual Studio 2012 Update 4
nl.vcredist2010_title=Visual C++ Redistributable for Visual Studio 2010

[Code]

function VCRedist2010NeedsInstall86: Boolean;
var isInstalled: Boolean;
begin
  isInstalled := FileExists('c:\Windows\SysWOW64\msvcr100.dll') OR  FileExists('c:\Windows\system32\msvcr100.dll')
  Result :=  not isInstalled;
end;

function VCRedist2012NeedsInstall86: Boolean;
var isInstalled: Boolean;
begin
  isInstalled := FileExists('c:\Windows\SysWOW64\msvcr110.dll') OR  FileExists('c:\Windows\system32\msvcr110.dll')
  Result :=  not isInstalled;
end;

Function GetVCRedist2012Text(param: String): String;
Begin
  Result := CustomMessage('vcredist2012_title')
End; 

Function GetVCRedist2010Text(param: String): String;
Begin
  Result := CustomMessage('vcredist2010_title')
End; 

function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE,
    'SYSTEM\CurrentControlSet\Control\Session Manager\Environment',
    'Path', OrigPath)
  then begin
    Result := True;
    exit;
  end;
  // look for the path with leading and trailing semicolon
  // Pos() returns 0 if not found
  Result := Pos(';' + Param + ';', ';' + OrigPath + ';') = 0;
end;
