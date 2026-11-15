# Ciko. One-command Windows startup. Existing .env and database are preserved.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host 'Docker Desktop is not installed. Install it first: https://www.docker.com/products/docker-desktop/' -ForegroundColor Red
  exit 1
}

$null = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Start Docker Desktop and wait for Engine running, then try again.' -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path '.env')) {
  # Every local installation receives unique secrets. Do not commit .env to Git.
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  function Random-Hex([int]$count) {
    $bytes = New-Object byte[] $count
    $rng.GetBytes($bytes)
    return [BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
  }
  $dbPassword = Random-Hex 20
  $access = Random-Hex 40
  $refresh = Random-Hex 40
  $contents = @"
POSTGRES_PASSWORD=$dbPassword
ACCESS_TOKEN_SECRET=$access
REFRESH_TOKEN_SECRET=$refresh
HTTP_PORT=8080
CORS_ORIGIN=http://localhost:8080
PUBLIC_BASE_URL=http://localhost:8080
COOKIE_SECURE=false
SEED_DEMO=true
"@
  [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'),$contents,[System.Text.Encoding]::UTF8)
  Write-Host 'Created .env with random secrets.'
}

Write-Host 'Building Ciko...' -ForegroundColor Cyan
docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Build failed. Last logs:' -ForegroundColor Red
  docker compose logs --tail=40
  exit 1
}

Write-Host 'Waiting for API...' -ForegroundColor Cyan
$healthy = $false
for ($i=0; $i -lt 35; $i++) {
  try {
    $status=Invoke-WebRequest -Uri 'http://localhost:8080/api/health' -TimeoutSec 2 -UseBasicParsing
    if ($status.StatusCode -eq 200) { $healthy=$true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if (-not $healthy) {
  Write-Host 'API did not become ready. Check logs:' -ForegroundColor Yellow
  docker compose ps
  docker compose logs --tail=50 api web db
  exit 1
}
Write-Host 'Ciko is ready: http://localhost:8080' -ForegroundColor Green
Start-Process 'http://localhost:8080'
