; -- InnoMarktplaatstabel.iss --

[Setup]
AppName=Marktplaatstabel
AppVersion=1.3.2
DefaultDirName={pf}\Marktplaatstabel
DefaultGroupName=Marktplaatstabel
UninstallDisplayIcon={app}\images\marktplaatstabel.ico
;OutputDir=userdocs:Inno Setup Examples Output
SetupIconFile="images\marktplaatstabel.ico"
WizardImageFile="images\WizModernImage.bmp"

[Languages]
Name: "nl"; MessagesFile: "compiler:Languages\Dutch.isl"

[Files]
DestDir: {app}; Source: *; Excludes: "*.iss,\images\WizModernImage.bmp,\Output\*"; Flags: recursesubdirs createallsubdirs 
Source: CertMgr.exe; DestDir: {app}; Flags: deleteafterinstall
Source: server.crt; DestDir: {app}; Flags: deleteafterinstall
Source: Excel files\Voorbeeldtabel.xlsm; DestDir: {commondocs}\Marktplaats-tabel;
;Source: "Readme.txt"; DestDir: "{app}"; Flags: isreadme
Source: "Visual C++ Redistributable for Visual Studio 2012 Update 4\vcredist_x86.exe"; DestDir: {tmp}; Flags: deleteafterinstall

[Dirs]
Name: "{commondocs}\Marktplaats-tabel"

[Icons]
Name: "{group}\Marktplaatstabel Starten"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{group}\Marktplaatstabel Stoppen"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{group}\Deinstalleer Marktplaatstabel"; Filename: "{uninstallexe}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Starten"; Filename: "{app}\start.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"
Name: "{commondesktop}\Marktplaatstabel Stoppen"; Filename: "{app}\stop.bat"; WorkingDir: "{app}"; IconFilename: "{app}\images\marktplaatstabel.ico"

[Run]
Filename: {app}\CertMgr.exe; Parameters: "-add -all -c server.crt -s -r localmachine root"; Flags: waituntilterminated runhidden;
Filename: {app}\start.bat; Description: {cm:LaunchProgram,Marktplaatstabel}; Flags: postinstall;
Filename: "{tmp}\vcredist_x86.exe"; Check: VCRedistNeedsInstall86; Parameters: "/passive /norestart"; StatusMsg: Starting installation of {code:GetVCRedistText}...

[CustomMessages]
; See example: http://fb2epub.googlecode.com/svn/trunk/Fb2ePubSetup/scripts/products/vcredist2012.iss
nl.vcredist2012_title=Visual C++ Redistributable for Visual Studio 2012 Update 4 
nl.vcredist2012_size=6.3 MB
nl.vcredist2012_size_x64=6.9 MB

;http://www.microsoft.com/globaldev/reference/lcid-all.mspx
nl.vcredist2012_lcid=

; install , then search in C:\ProgramData\Package Cache\ for file name, subfolder name is GUID for package to detect
; mind no spaces after =
;11.0.61030 (Update4)
nl.VC_2012_REDIST_X86_UP4 ={33d1fd90-4274-48a1-9bc1-97e33d9c2d6f}
nl.VC_2012_REDIST_X64_UP4 ={ca67548a-5ebe-413a-b50c-4b9ceb6d66c6}
nl.vcredist2012_u4_url =http://download.microsoft.com/download/1/6/B/16B06F60-3B20-4FF2-B699-5E9B7962F9AE/VSU4/vcredist_x86.exe
nl.vcredist2012_u4_url_x64 =http://download.microsoft.com/download/1/6/B/16B06F60-3B20-4FF2-B699-5E9B7962F9AE/VSU4/vcredist_x64.exe

[Code]
const 
  VC_2012_UNINSTALL_PATH = 'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\';
  VC_2012_REDIST_X86_UP4_GUID='{33d1fd90-4274-48a1-9bc1-97e33d9c2d6f}';
  VC_2012_REDIST_X64_UP4_GUID='{ca67548a-5ebe-413a-b50c-4b9ceb6d66c6}';

function VC2012VersionInstalled(const ProductID: string): Boolean;
var
Installed: cardinal;
begin
  RegQueryDWordValue(HKEY_LOCAL_MACHINE_32,VC_2012_UNINSTALL_PATH + ProductID ,'Installed',Installed);
  Result := (Installed = 1);
end;

function VCRedistNeedsInstall86: Boolean;
var localInstalled: Boolean;
var englishInstalled: Boolean;
begin
    // here the Result must be True when you need to install your VCRedist
  // or False when you don't need to, so now it's upon you how you build
  // this statement, the following won't install your VC redist only when
  localInstalled := VC2012VersionInstalled(CustomMessage('VC_2012_REDIST_X86_UP4'));
  englishInstalled := VC2012VersionInstalled(VC_2012_REDIST_X86_UP4_GUID);
  Result :=  not ( localInstalled or englishInstalled);
end;

Function GetVCRedistText(param: String): String;
Begin
  Result := CustomMessage('vcredist2012_title')
End; 
