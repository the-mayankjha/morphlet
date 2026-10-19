param([switch]$SelfTest,[switch]$SelectionOnly,[ValidateSet("control","alt","disabled")][string]$Modifier="control")
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class MorphletPointer {
 [StructLayout(LayoutKind.Sequential)] public struct Point { public int X; public int Y; }
 [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int key);
 [DllImport("user32.dll")] public static extern bool GetCursorPos(out Point point);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 public static bool OtherKeyDown(int modifier) {
  for(int key=8;key<255;key++) {
   if(modifier==0x12&&(key==0x12||key==0xA4||key==0xA5))continue;
   if(modifier==0x11&&(key==0x11||key==0xA2||key==0xA3))continue;
   if((GetAsyncKeyState(key)&0x8000)!=0)return true;
  }
  return false;
 }
}
'@
$shell = New-Object -ComObject Shell.Application
function Get-ExplorerFiles([long]$handle) {
 $files = @()
 try { foreach ($window in $shell.Windows()) {
  if ([long]$window.HWND -eq $handle) {
   foreach ($item in $window.Document.SelectedItems()) {
    if ($item.IsFileSystem -and -not $item.IsFolder -and $item.Path) { $files += [string]$item.Path; if ($files.Count -ge 100) { break } }
   }
   break
  }
 } } catch { }
 return $files
}
# A tap must end in its original foreground window and must not be part of a
# mouse gesture or another keyboard shortcut (Alt+Tab, Alt+C, Alt+F4, AltGr...).
$script:wasAlt=$false; $script:altUsed=$false; $script:altWindow=0
function Update-AltTap([bool]$alt,[bool]$used,[long]$foreground) {
 $fire=$false
 if ($alt -and -not $script:wasAlt) { $script:altWindow=$foreground; $script:altUsed=$used }
 if ($alt -and $used) { $script:altUsed=$true }
 if (-not $alt -and $script:wasAlt) { $fire=(-not $script:altUsed -and -not $used -and $foreground -eq $script:altWindow) }
 $script:wasAlt=$alt
 return $fire
}
if ($SelfTest) {
 if (Update-AltTap $true $false 7) { throw 'Alt fired before release' }
 if (-not (Update-AltTap $false $false 7)) { throw 'Alt tap did not fire' }
 [void](Update-AltTap $true $false 7); [void](Update-AltTap $true $true 7)
 if (Update-AltTap $false $false 7) { throw 'Alt shortcut triggered selection' }
 [void](Update-AltTap $true $false 7)
 if (Update-AltTap $false $false 8) { throw 'Changed foreground triggered selection' }
 [void](Update-AltTap $true $true 7)
 if (Update-AltTap $false $false 7) { throw 'Alt drag triggered selection' }
 [Console]::WriteLine('{"ready":true,"altTapTests":4}'); exit 0
}
if ($SelectionOnly) {
 $files=@(Get-ExplorerFiles ([MorphletPointer]::GetForegroundWindow().ToInt64()))
 [Console]::WriteLine((@{files=@($files)} | ConvertTo-Json -Compress -Depth 3)); exit 0
}
$modifierKey=if ($Modifier -eq "alt") { 0x12 } else { 0x11 }
$wasDown=$false; $fired=$false; $origin=New-Object MorphletPointer+Point; $dragWindow=0
while ($true) {
 $down=([MorphletPointer]::GetAsyncKeyState(1) -band 0x8000) -ne 0
 $alt=([MorphletPointer]::GetAsyncKeyState(0x12) -band 0x8000) -ne 0
 $foreground=[MorphletPointer]::GetForegroundWindow().ToInt64()
 $pressed=($Modifier -ne "disabled") -and (([MorphletPointer]::GetAsyncKeyState($modifierKey) -band 0x8000) -ne 0)
 $other=$false; if ($pressed -or $script:wasAlt) { $other=[MorphletPointer]::OtherKeyDown($modifierKey) }
 $tap=Update-AltTap $pressed ($down -or $other -or $fired) $foreground
 if ($tap) { $files=@(Get-ExplorerFiles $foreground); if ($files.Count) { [Console]::WriteLine((@{type='selection';files=@($files)} | ConvertTo-Json -Compress -Depth 3)) } }
 $point=New-Object MorphletPointer+Point; [void][MorphletPointer]::GetCursorPos([ref]$point)
 if ($down -and -not $wasDown) { $origin=$point; $fired=$false; $dragWindow=$foreground }
 if (-not $down -and $wasDown) { [Console]::WriteLine('{"type":"release"}'); $fired=$false }
 $distance=[Math]::Sqrt([Math]::Pow($point.X-$origin.X,2)+[Math]::Pow($point.Y-$origin.Y,2))
 if ($down -and $alt -and -not $fired -and $distance -ge 8) {
  $files=@(Get-ExplorerFiles $dragWindow); $fired=$true
  [Console]::WriteLine((@{type='trigger';files=@($files)} | ConvertTo-Json -Compress -Depth 3))
 }
 $wasDown=$down; Start-Sleep -Milliseconds 30
}
