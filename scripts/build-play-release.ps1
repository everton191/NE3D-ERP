param(
    [string]$SigningConfig = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.android-keystores\simplifica3d\upload-key.json'),
    [string]$BundletoolJar,
    [string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (!$OutputDirectory) { $OutputDirectory = Join-Path $taskRoot ('artifacts\play-release-' + (Get-Date -Format 'yyyyMMdd')) }
if (!$BundletoolJar) { $BundletoolJar = Join-Path $taskRoot 'artifacts\tools\bundletool-all-1.18.3.jar' }
if (!(Test-Path -LiteralPath $SigningConfig)) { throw 'Upload signing configuration is missing. Do not use the debug key for release.' }
if (!(Test-Path -LiteralPath $BundletoolJar)) { throw 'Official bundletool JAR is missing.' }
$expectedBundletoolHash = 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29'
if ((Get-FileHash -LiteralPath $BundletoolJar -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedBundletoolHash) { throw 'Bundletool must match the verified official 1.18.3 release.' }
$configuration = Get-Content -LiteralPath $SigningConfig -Raw | ConvertFrom-Json
if ($configuration.applicationId -ne 'br.com.ne3d.erp') { throw 'Signing configuration belongs to another application.' }
foreach ($file in @($configuration.keyStoreFile, $configuration.credentialFile, $configuration.certificateFile)) {
    if (!(Test-Path -LiteralPath $file)) { throw 'Signing material is missing. Do not recreate an existing upload key.' }
}
$credential = Import-Clixml -LiteralPath $configuration.credentialFile
if ($credential -isnot [System.Management.Automation.PSCredential] -or $credential.UserName -ne $configuration.keyAlias) { throw 'Invalid protected signing credential.' }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
$runId = [Guid]::NewGuid().ToString()
$log = Join-Path $OutputDirectory ($runId + '-build.log')
$names = @('SIMPLIFICA_PLAY_UPLOAD_STORE_FILE','SIMPLIFICA_PLAY_UPLOAD_STORE_PASSWORD','SIMPLIFICA_PLAY_UPLOAD_KEY_ALIAS','SIMPLIFICA_PLAY_UPLOAD_KEY_PASSWORD','SIMPLIFICA_PLAY_UPLOAD_CERT_SHA256','SIMPLIFICA_BUNDLETOOL_JAR','PATH')
$original = @{}
foreach ($name in $names) { $original[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
function Invoke-LocalBuildTool([string]$Executable, [string[]]$ToolArguments) {
    $savedPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $Executable @ToolArguments 2>&1 | Tee-Object -FilePath $log -Append | ForEach-Object { Write-Host $_ }
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedPreference
    if ($exitCode -ne 0) { throw "Local build step failed (exit $exitCode). Inspect $log; no upload performed." }
}
Push-Location $taskRoot
try {
    if (!$env:JAVA_HOME -or !(Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\jarsigner.exe'))) { throw 'Set JAVA_HOME to JDK 21 before building.' }
    $env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
    $env:SIMPLIFICA_PLAY_UPLOAD_STORE_FILE = $configuration.keyStoreFile
    $env:SIMPLIFICA_PLAY_UPLOAD_STORE_PASSWORD = $credential.GetNetworkCredential().Password
    $env:SIMPLIFICA_PLAY_UPLOAD_KEY_PASSWORD = $env:SIMPLIFICA_PLAY_UPLOAD_STORE_PASSWORD
    $env:SIMPLIFICA_PLAY_UPLOAD_KEY_ALIAS = $configuration.keyAlias
    $env:SIMPLIFICA_PLAY_UPLOAD_CERT_SHA256 = $configuration.certificateSha256
    $env:SIMPLIFICA_BUNDLETOOL_JAR = [IO.Path]::GetFullPath($BundletoolJar)
    $existing = Join-Path $taskRoot 'android\app\build\outputs\bundle\playRelease\app-play-release.aab'
    if (Test-Path -LiteralPath $existing) {
        $previousDirectory = Join-Path $OutputDirectory 'previous-generated'
        New-Item -ItemType Directory -Path $previousDirectory -Force | Out-Null
        $oldHash = (Get-FileHash -LiteralPath $existing -Algorithm SHA256).Hash.ToLowerInvariant()
        $preserved = Join-Path $previousDirectory ($oldHash + '.aab')
        if (!(Test-Path -LiteralPath $preserved)) { Copy-Item -LiteralPath $existing -Destination $preserved }
    }
    foreach ($test in @('check-release-consistency','test-play-bundle-signature','test-play-ai-disabled','test-play-no-self-update','test-play-no-external-checkout','test-play-account-deletion','test-prepublication-p0','test-config-image-selection','test-config-image-encoding')) {
        Invoke-LocalBuildTool 'node.exe' @("scripts/$test.js")
    }
    Invoke-LocalBuildTool 'node.exe' @('scripts/prepare-web.js','--without-downloads')
    Invoke-LocalBuildTool 'node.exe' @('node_modules/@capacitor/cli/bin/capacitor','sync','android')
    Invoke-LocalBuildTool (Join-Path $taskRoot 'android\gradlew.bat') @('--project-dir','android','--offline','--no-daemon',':app:bundlePlayRelease','--console=plain')
    $inspectionText = & node.exe 'scripts/inspect-play-bundle.js'
    if ($LASTEXITCODE -ne 0) { throw 'Bundle inspection failed; no final upload file will be copied.' }
    $inspection = ($inspectionText -join "`n") | ConvertFrom-Json
    if (!$inspection.artifactSignatureVerified -or !$inspection.bundleIdentity) { throw 'Signature/identity was not verified.' }
    $name = 'Simplifica3D-' + $inspection.bundleIdentity.versionName + '-vc' + $inspection.bundleIdentity.versionCode + '-play-release.aab'
    $destination = Join-Path $OutputDirectory $name
    if (Test-Path -LiteralPath $destination) { throw 'Refusing to overwrite a delivered AAB. Choose a new output directory.' }
    Copy-Item -LiteralPath $inspection.bundle -Destination $destination
    if ((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $inspection.sha256) { throw 'Delivered AAB checksum differs.' }
    [IO.File]::WriteAllText((Join-Path $OutputDirectory 'artifact-verification.json'), ($inspection | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
    Write-Output ([pscustomobject]@{File=$destination;SHA256=$inspection.sha256;UploadCertificateVerified=$true;PublicReleaseApproved=$false;BuildLog=$log} | ConvertTo-Json)
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $original[$name], 'Process') }
    $credential = $null
    Pop-Location
}
