param(
  [string]$ProjectRef = "qsufnnivlgdidmjuaprb",
  [string]$EnvFile = "supabase/.env.mercadopago.local"
)

$ErrorActionPreference = "Stop"

function Get-SupabaseCli {
  $cmd = Get-Command supabase -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $cached = Get-ChildItem -Path "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Filter supabase.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

  if ($cached) {
    return $cached
  }

  throw "Supabase CLI não encontrado. Instale ou rode 'npx supabase login' uma vez."
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Arquivo de ambiente não encontrado: $EnvFile"
}

$supabase = Get-SupabaseCli
$pairs = Get-Content -LiteralPath $EnvFile |
  Where-Object { $_ -and -not $_.TrimStart().StartsWith("#") } |
  ForEach-Object { $_.Trim() }

if (-not $pairs -or $pairs.Count -lt 1) {
  throw "Nenhum secret encontrado em $EnvFile"
}

function Invoke-Supabase {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  & $supabase @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI falhou: supabase $($Args -join ' ')"
  }
}

Invoke-Supabase secrets set @pairs --project-ref $ProjectRef

Invoke-Supabase functions deploy mercadopago-create-payment --project-ref $ProjectRef
Invoke-Supabase functions deploy mercadopago-create-subscription --project-ref $ProjectRef
Invoke-Supabase functions deploy mercadopago-cancel-subscription --project-ref $ProjectRef
Invoke-Supabase functions deploy mercadopago-webhook --project-ref $ProjectRef

Write-Host "Mercado Pago configurado no Supabase e funções publicadas."
