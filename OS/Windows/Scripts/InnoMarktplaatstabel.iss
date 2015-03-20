; -- InnoMarktplaatstabel.iss --

[Setup]
AppName=Marktplaatstabel
AppVersion=2.4.2
DefaultDirName={pf}\Marktplaatstabel
DefaultGroupName=Marktplaatstabel
UninstallDisplayIcon={app}\marktplaatstabel\img\marktplaatstabel.ico
SetupIconFile="..\..\..\Images\marktplaatstabel.ico"
WizardImageFile="..\..\..\Images\WizModernImage.bmp"
PrivilegesRequired=admin

[Languages]
Name: "nl"; MessagesFile: "compiler:Languages\Dutch.isl"

[Dirs]
Name: "{commondocs}\Marktplaatstabel"
Name: "{commondocs}\Marktplaatstabel\afbeeldingen"

[Files]
DestDir: {app}; Source: ..\..\..\WWW\*; Excludes: "*.iss, *.msi, *.log, *.swp, *.*~"; Flags: recursesubdirs createallsubdirs 

Source: "..\Node.js\node-v0.10.33-x64.msi"; DestDir: "{tmp}"; Check: IsWin64;
Source: "..\Node.js\node-v0.10.33-x86.msi"; DestDir: "{tmp}"; Check: not IsWin64;
Source: "..\..\..\Examples\Voorbeeldtabel.xlsm"; DestDir: {commondocs}\Marktplaatstabel;
Source: "..\..\..\Examples\Voorbeeldtabel.xls"; DestDir: {commondocs}\Marktplaatstabel;
Source: "..\..\..\Examples\Voorbeeld.xml"; DestDir: {commondocs}\Marktplaatstabel;
Source: "..\..\..\Images\logo.jpg"; DestDir: {commondocs}\Marktplaatstabel\afbeeldingen;
Source: "..\..\..\Images\screenshot*.jpg"; DestDir: {commondocs}\Marktplaatstabel\afbeeldingen;
Source: "..\..\..\Images\marktplaatstabel.ico"; DestDir: {app}\marktplaatstabel\img;
Source: "*"; DestDir: {app}\Scripts;
Source: "bin\*"; DestDir: {app}\Scripts;

[Icons]
Name: "{group}\Marktplaatstabel Starten"; Filename: "{app}\Scripts\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\marktplaatstabel\img\marktplaatstabel.ico"
Name: "{group}\Marktplaatstabel Stoppen"; Filename: "{app}\Scripts\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\marktplaatstabel\img\marktplaatstabel.ico"
Name: "{group}\Deinstalleer Marktplaatstabel"; Filename: "{uninstallexe}"; IconFilename: "{app}\marktplaatstabel\img\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Starten"; Filename: "{app}\Scripts\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\marktplaatstabel\img\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Stoppen"; Filename: "{app}\Scripts\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\marktplaatstabel\img\marktplaatstabel.ico"

[Run]
Filename: {app}\Scripts\addToHostsFile.bat; Flags: waituntilterminated runhidden; StatusMsg: Marktplaatstabel wordt toegevoegd aan het Windows hosts bestand.;
Filename: {app}\Scripts\start.bat; Description: {cm:LaunchProgram,Marktplaatstabel}; Flags: postinstall;
Filename: "msiexec.exe"; Parameters: "/passive /i ""{tmp}\node-v0.10.33-x64.msi"""; Check: IsWin64;
Filename: "msiexec.exe"; Parameters: "/passive /i ""{tmp}\node-v0.10.33-x86.msi"""; Check: not IsWin64;

;Create folder shortcut in C:\Users\{username}\Links to C:\Users\Public\Documents\Marktplaatstabel\
Filename: {app}\Scripts\nircmdc.exe; Parameters: "shortcut ""{commondocs}\Marktplaatstabel"" ""{sd}\Users\{username}\Links\"" ""Marktplaatstabel"" """" ""{app}\marktplaatstabel\img\marktplaatstabel.ico"" 0 "; Flags: runhidden

[UninstallRun]
Filename: {app}\Scripts\stop.bat; Parameters: "-passive"; Flags: runhidden

[UninstallDelete]
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\logo.jpg"
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\screenshot1.jpg"
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\screenshot2.jpg"
Type: files; Name: "{commondocs}\Marktplaatstabel\afbeeldingen\screenshot3.jpg"
Type: files; Name: "{sd}\Users\{username}\Links\Marktplaatstabel.lnk"

Type: dirifempty; Name: "{commondocs}\Marktplaatstabel\afbeeldingen"
Type: dirifempty; Name: "{commondocs}\Marktplaatstabel"
