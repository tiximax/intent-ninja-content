# Deploy Supabase Functions & DB (PowerShell)
# Usage examples:
#   ./deploy-functions.ps1                     # Link project (from .env), db push, set secrets from .env.secrets.local (if any), deploy functions (if sources exist)
#   ./deploy-functions.ps1 -ProjectRef abc123  # Explicit project ref
#   ./deploy-functions.ps1 -RunLiveTests       # Also run Playwright live tests (needs VITE_* env or .env values)

param(
  [string]$ProjectRef,
  [switch]$RunLiveTests
)

set-strictmode -version latest
$ErrorActionPreference = 'Stop'

function Get-SupabaseCLI {
  $repoRoot = $PSScriptRoot
  $localCli = Join-Path $repoRoot 'supabase.exe'
  if (Test-Path $localCli) { return $localCli }
  $cmd = Get-Command supabase -ErrorAction SilentlyContinue
  if ($cmd) { return 'supabase' }
  throw 'Supabase CLI not found. Use .\supabase.exe or install supabase in PATH.'
}

function Get-DotenvValue([string]$key) {
  $dotenvPath = Join-Path $PSScriptRoot '.env'
  if (-not (Test-Path $dotenvPath)) { return $null }
  $match = Select-String -Path $dotenvPath -Pattern ("^\s*${key}\s*=") | Select-Object -First 1
  if (-not $match) { return $null }
  $value = $match.Line -replace ("^\s*${key}\s*=\s*"), ''
  return $value.Trim().Trim('"')
}

try {
  $cli = Get-SupabaseCLI
  $ref = if ($ProjectRef) { $ProjectRef } elseif ($env:PROJECT_REF) { $env:PROJECT_REF } else { Get-DotenvValue 'VITE_SUPABASE_PROJECT_ID' }
  if (-not $ref) { throw 'PROJECT_REF not provided and VITE_SUPABASE_PROJECT_ID not found in .env' }

  Write-Host "Linking project $ref ..."
  & $cli link --project-ref $ref

  Write-Host 'Pushing migrations ...'
  & $cli db push

  $secretsFile = Join-Path $PSScriptRoot '.env.secrets.local'
  if (Test-Path $secretsFile) {
    Write-Host "Setting secrets from .env.secrets.local (values not printed) ..."
    & $cli secrets set --env-file $secretsFile --project-ref $ref
  } else {
    Write-Host 'No .env.secrets.local found; skipping secrets set. Create one with lines like: OPENAI_API_KEY=..., GEMINI_API_KEY=..., SERPAPI_API_KEY=..., CONTENT_MODEL=...'
  }

  $funcRoot = Join-Path $PSScriptRoot 'supabase\functions'
  $deployList = @()
  if (Test-Path (Join-Path $funcRoot 'generate-content')) { $deployList += 'generate-content' }
  if (Test-Path (Join-Path $funcRoot 'serpapi-keywords')) { $deployList += 'serpapi-keywords' }
  if ($deployList.Count -gt 0) {
    foreach ($fn in $deployList) {
      Write-Host "Deploying function $fn ..."
      & $cli functions deploy $fn --project-ref $ref
    }
  } else {
    Write-Host 'No function source folders present; skipping deploy (see supabase/functions/README.md).'
  }

  if ($RunLiveTests) {
    $viteUrl  = if ($env:VITE_SUPABASE_URL) { $env:VITE_SUPABASE_URL } else { Get-DotenvValue 'VITE_SUPABASE_URL' }
    $viteAnon = if ($env:VITE_SUPABASE_ANON_KEY) { $env:VITE_SUPABASE_ANON_KEY } else { Get-DotenvValue 'VITE_SUPABASE_ANON_KEY' }
    if ($viteUrl -and $viteAnon) {
      $env:VITE_SUPABASE_URL = $viteUrl
      $env:VITE_SUPABASE_ANON_KEY = $viteAnon
      $env:RUN_LIVE_GEN = 'true'
      $env:RUN_LIVE_GEMINI = 'true'
      $env:RUN_LIVE_SERPAPI = 'true'
      Write-Host 'Running Playwright live tests ...'
      npm run test:e2e -- tests/e2e/generate-content-live.spec.ts
      npm run test:e2e -- tests/e2e/generate-content-gemini-live.spec.ts
      npm run test:e2e -- tests/e2e/serpapi-live.spec.ts
    } else {
      Write-Warning 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY; skipping live tests.'
    }
  }

  Write-Host 'Done.'
  exit 0
} catch {
  Write-Error $_
  exit 1
}
