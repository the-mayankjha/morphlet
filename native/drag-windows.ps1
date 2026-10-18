param([switch]$SelfTest)

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
}
'@
$shell = New-Object -ComObject Shell.Application
if ($SelfTest) { [Console]::WriteLine('{"ready":true}'); exit 0 }
$wasDown = $false; $fired = $false; $origin = New-Object MorphletPointer+Point
while ($true) {
 $down = ([MorphletPointer]::GetAsyncKeyState(1) -band 0x8000) -ne 0
 $alt = ([MorphletPointer]::GetAsyncKeyState(0x12) -band 0x8000) -ne 0
 $point = New-Object MorphletPointer+Point
 [void][MorphletPointer]::GetCursorPos([ref]$point)
 if ($down -and -not $wasDown) { $origin = $point; $fired = $false }
 if (-not $down -and $wasDown) { [Console]::WriteLine('{"type":"release"}'); $fired = $false }
 $distance = [Math]::Sqrt([Math]::Pow($point.X-$origin.X,2)+[Math]::Pow($point.Y-$origin.Y,2))
 if ($down -and $alt -and -not $fired -and $distance -ge 8) {
  $files = @(); $foreground = [MorphletPointer]::GetForegroundWindow().ToInt64()
  try { foreach ($window in $shell.Windows()) {
   if ([long]$window.HWND -eq $foreground) {
    foreach ($item in $window.Document.SelectedItems()) { if (-not $item.IsFolder -and $item.Path) { $files += [string]$item.Path } }
    break
   }
  } } catch { }
  $fired = $true
  [Console]::WriteLine((@{type='trigger';files=@($files)} | ConvertTo-Json -Compress -Depth 3))
 }
 $wasDown=$down
 Start-Sleep -Milliseconds 30
}
