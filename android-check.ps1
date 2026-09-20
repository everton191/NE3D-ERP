[CmdletBinding()]
param(
    [string]$ProjectRoot = $PSScriptRoot,
    [switch]$RequireDevice
)

$ErrorActionPreference = 'Stop'
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { 'C:\Users\PAESS\AppData\Local\Android\Sdk' }
$javaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME.TrimEnd('\') } else { Split-Path -Parent (Split-Path -Parent (Get-Command java).Source) }
$adb = Join-Path $sdk 'platform-tools\adb.exe'
$sdkManager = Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat'
$gradle = Join-Path $ProjectRoot 'android\gradlew.bat'
$variablesGradle = Join-Path $ProjectRoot 'android\variables.gradle'
$failed = [System.Collections.Generic.List[string]]::new()

function Test-Tool([string]$Name, [string]$Path) {
    if (Test-Path -LiteralPath $Path) { Write-Host "[OK] $Name`: $Path" -ForegroundColor Green; return $true }
    Write-Host "[FALHA] $Name`: $Path" -ForegroundColor Red
    $script:failed.Add($Name)
    return $false
}

Write-Host '=== Ambiente Android CLI ==='
if (Test-Tool 'Java' (Join-Path $javaHome 'bin\java.exe')) { & (Join-Path $javaHome 'bin\java.exe') -version }
if (Test-Tool 'Android SDK' $sdk) {
    Test-Tool 'adb' $adb | Out-Null
    Test-Tool 'sdkmanager' $sdkManager | Out-Null
}
if (Test-Tool 'Gradle Wrapper' $gradle) { & $gradle --version --no-daemon }
if (Get-Command node -ErrorAction SilentlyContinue) { Write-Host "[OK] Node: $(node --version)" -ForegroundColor Green } else { $failed.Add('Node') }
if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { Write-Host "[OK] npm: $(npm.cmd --version)" -ForegroundColor Green } else { $failed.Add('npm') }
if (Test-Path -LiteralPath (Join-Path $ProjectRoot 'node_modules\@capacitor\cli\bin\capacitor')) {
    Push-Location $ProjectRoot
    try { Write-Host "[OK] Capacitor: $(npx.cmd cap --version)" -ForegroundColor Green } finally { Pop-Location }
} else { Write-Host '[FALHA] Capacitor local nao instalado.' -ForegroundColor Red; $failed.Add('Capacitor') }

$required = @()
if (Test-Path -LiteralPath $variablesGradle) {
    $content = Get-Content -LiteralPath $variablesGradle -Raw
    foreach ($name in 'compileSdkVersion','targetSdkVersion','minSdkVersion') {
        if ($content -match "$name\s*=\s*(\d+)") { Write-Host "[OK] $name = $($Matches[1])"; if ($name -eq 'compileSdkVersion') { $required += "platforms\android-$($Matches[1])"; $required += "build-tools\$($Matches[1]).0.0" } }
    }
}
foreach ($relative in $required) { Test-Tool "SDK $relative" (Join-Path $sdk $relative) | Out-Null }

if (Test-Path -LiteralPath $adb) {
    & $adb --version
    $deviceLines = @(& $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\S' })
    $authorized = @($deviceLines | Where-Object { $_ -match '\sdevice$' })
    if ($authorized.Count) { Write-Host "[OK] Dispositivo autorizado: $($authorized -join ', ')" -ForegroundColor Green }
    elseif ($RequireDevice) { Write-Host '[FALHA] Nenhum dispositivo autorizado.' -ForegroundColor Red; $failed.Add('dispositivo autorizado') }
    else { Write-Host '[AVISO] Nenhum dispositivo autorizado; build CLI ainda pode ser validado.' -ForegroundColor Yellow }
}

if ($failed.Count) { throw "Falhas encontradas: $($failed -join ', ')" }
Write-Host 'ANDROID CLI CHECK: OK' -ForegroundColor Green
