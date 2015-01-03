; -- InnoMarktplaatstabel.iss --

[Setup]
AppName=Marktplaatstabel
AppVersion=1.4.2
DefaultDirName={pf}\Marktplaatstabel
DefaultGroupName=Marktplaatstabel
UninstallDisplayIcon={app}\images\marktplaatstabel.ico
SetupIconFile="..\images\marktplaatstabel.ico"
WizardImageFile="..\images\WizModernImage.bmp"
PrivilegesRequired=admin

[Languages]
Name: "nl"; MessagesFile: "compiler:Languages\Dutch.isl"

[Dirs]
Name: "{commondocs}\Marktplaatstabel"
Name: "{commondocs}\Marktplaatstabel\afbeeldingen"

[Files]
DestDir: {app}; Source: ..\*; Excludes: "*.iss, *.msi, *.log, *.swp, *.*~, \images\WizModernImage.bmp"; Flags: recursesubdirs createallsubdirs 

Source: "..\Installer\node-v0.10.33-x64.msi"; DestDir: "{tmp}"; Check: IsWin64;
Source: "..\Installer\node-v0.10.33-x86.msi"; DestDir: "{tmp}"; Check: not IsWin64;
Source: "..\Data files\Voorbeeldtabel.xlsm"; DestDir: {commondocs}\Marktplaatstabel;
Source: "..\Data files\Voorbeeldtabel.xls"; DestDir: {commondocs}\Marktplaatstabel;
Source: "..\Data files\Voorbeeld.xml"; DestDir: {commondocs}\Marktplaatstabel;
Source: "..\images\logo.jpg"; DestDir: {commondocs}\Marktplaatstabel\afbeeldingen;
Source: "..\images\screenshot*.jpg"; DestDir: {commondocs}\Marktplaatstabel\afbeeldingen;

[Registry]
;Add location of Nodejs to path.
;Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};C:\Program Files\Nodejs"; Check: NeedsAddPath('C:\Windows\SysWow64')

[Icons]
Name: "{group}\Marktplaatstabel Starten"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{group}\Marktplaatstabel Stoppen"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{group}\Deinstalleer Marktplaatstabel"; Filename: "{uninstallexe}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Starten"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Stoppen"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"

[Run]
Filename: {app}\misc\addToHostsFile.bat; Flags: waituntilterminated runhidden; StatusMsg: Marktplaatstabel wordt toegevoegd aan het Windows hosts bestand.;
Filename: {app}\start.bat; Description: {cm:LaunchProgram,Marktplaatstabel}; Flags: postinstall;
Filename: "msiexec.exe"; Parameters: "/passive /i ""{tmp}\node-v0.10.33-x64.msi"""; Check: IsWin64;
Filename: "msiexec.exe"; Parameters: "/passive /i ""{tmp}\node-v0.10.33-x86.msi"""; Check: not IsWin64;

;Create folder shortcut in C:\Users\{username}\Links to C:\Users\Public\Documents\Marktplaatstabel\
Filename: {app}\misc\nircmdc.exe; Parameters: "shortcut ""{commondocs}\Marktplaatstabel"" ""{sd}\Users\{username}\Links\"" ""Marktplaatstabel"" """" ""{app}\images\marktplaatstabel.ico"" 0 "; Flags: runhidden

[UninstallRun]
Filename: {app}\stop.bat; Parameters: "-passive"; Flags: runhidden

[UninstallDelete]
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\logo.jpg"
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\screenshot1.jpg"
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\screenshot2.jpg"
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\screenshot3.jpg"
Type: files; Name: "{sd}\Users\{username}\Links\Marktplaatstabel.lnk"

Type: dirifempty; Name: "{commondocs}\Marktplaatstabel\afbeeldingen"
Type: dirifempty; Name: "{commondocs}\Marktplaatstabel"

[Code]
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
