param([switch]$SelfTest,[switch]$SelectionOnly,[ValidateSet("control","alt","shift","disabled")][string]$Modifier="control",[ValidateSet("control","alt","shift","disabled")][string]$ConvertModifier="shift")
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
   if(modifier==0x10&&(key==0x10||key==0xA0||key==0xA1))continue;
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
# Separate tap state for conversion and editing; shortcuts and clicks cancel.
$script:gestures=@{tools=@{was=$false;used=$false;owner=0};convert=@{was=$false;used=$false;owner=0}}
function Update-ModifierTap([string]$mode,[bool]$pressed,[bool]$used,[long]$foreground) {
 $state=$script:gestures[$mode]; $fire=$false
 if ($pressed -and -not $state.was) { $state.owner=$foreground; $state.used=$used }
 if ($pressed -and $used) { $state.used=$true }
 if (-not $pressed -and $state.was) { $fire=(-not $state.used -and -not $used -and $foreground -eq $state.owner) }
 $state.was=$pressed; return $fire
}
if ($SelfTest) {
 foreach ($mode in @('tools','convert')) {
  if (Update-ModifierTap $mode $true $false 7) { throw 'Gesture fired before release' }
  if (-not (Update-ModifierTap $mode $false $false 7)) { throw 'Tap did not fire' }
  [void](Update-ModifierTap $mode $true $false 7); [void](Update-ModifierTap $mode $true $true 7)
  if (Update-ModifierTap $mode $false $false 7) { throw 'Keyboard shortcut triggered wheel' }
  [void](Update-ModifierTap $mode $true $false 7)
  if (Update-ModifierTap $mode $false $false 8) { throw 'Changed foreground triggered wheel' }
  [void](Update-ModifierTap $mode $true $true 7)
  if (Update-ModifierTap $mode $false $false 7) { throw 'Modifier-click triggered wheel' }
 }
 [Console]::WriteLine('{"ready":true,"modifierTests":8}'); exit 0
}
if ($SelectionOnly) {
 $files=@(Get-ExplorerFiles ([MorphletPointer]::GetForegroundWindow().ToInt64()))
 [Console]::WriteLine((@{files=@($files)} | ConvertTo-Json -Compress -Depth 3)); exit 0
}
$wasDown=$false; $fired=$false; $origin=New-Object MorphletPointer+Point; $dragWindow=0
while ($true) {
 $down=([MorphletPointer]::GetAsyncKeyState(1) -band 0x8000) -ne 0
 $alt=([MorphletPointer]::GetAsyncKeyState(0x12) -band 0x8000) -ne 0
 $foreground=[MorphletPointer]::GetForegroundWindow().ToInt64()
 foreach ($mode in @('tools','convert')) {
  $setting=if ($mode -eq 'tools') { $Modifier } else { $ConvertModifier }
  $key=if ($setting -eq 'alt') { 0x12 } elseif ($setting -eq 'shift') { 0x10 } else { 0x11 }
  $pressed=($setting -ne 'disabled') -and (([MorphletPointer]::GetAsyncKeyState($key) -band 0x8000) -ne 0)
  $other=$false; if ($pressed -or $script:gestures[$mode].was) { $other=[MorphletPointer]::OtherKeyDown($key) }
  if (Update-ModifierTap $mode $pressed ($down -or $other -or $fired) $foreground) {
   $files=@(Get-ExplorerFiles $foreground); if ($files.Count) { [Console]::WriteLine((@{type='selection';mode=$mode;files=@($files)} | ConvertTo-Json -Compress -Depth 3)) }
  }
 }
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
