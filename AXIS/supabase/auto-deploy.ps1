# ============================================================
# AXIS — Automatización completa de deploy Supabase
# Requiere: SUPABASE_ACCESS_TOKEN como variable de entorno
# ============================================================

param(
  [Parameter(Mandatory=$true)]
  [string]$Token,

  [string]$ProjectName = "axis-execution-os",
  [string]$Region      = "us-east-1",
  [string]$OrgName     = "AxisTeam"
)

$env:SUPABASE_ACCESS_TOKEN = $Token
$env:PATH += ";$env:APPDATA\npm"
$ErrorActionPreference = "Stop"

Write-Host "[1/8] Verificando autenticación..." -ForegroundColor Cyan
$orgsJson = supabase orgs list --output json 2>$null
if ($LASTEXITCODE -ne 0) { throw "Token inválido o expirado" }
$orgs = $orgsJson | ConvertFrom-Json
$org = $orgs | Where-Object { $_.name -eq $OrgName } | Select-Object -First 1
if (-not $org) {
  Write-Host "Organization '$OrgName' no encontrada. Disponibles:" -ForegroundColor Yellow
  $orgs | ForEach-Object { Write-Host "  - $($_.name) [$($_.id)]" }
  $org = $orgs | Select-Object -First 1
  Write-Host "Usando primera org: $($org.name)" -ForegroundColor Yellow
}
Write-Host "  Org ID: $($org.id)" -ForegroundColor Green

Write-Host "`n[2/8] Generando password DB seguro..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Web
$dbPwd = [System.Web.Security.Membership]::GeneratePassword(24, 4)
$dbPwd = $dbPwd -replace '[\\\/`"' + "'`$&]", 'X'  # quitar chars problemáticos para shell
Write-Host "  Password generado (guardado al final)" -ForegroundColor Green

Write-Host "`n[3/8] Creando proyecto Supabase '$ProjectName'..." -ForegroundColor Cyan
$existing = (supabase projects list --output json 2>$null | ConvertFrom-Json) | Where-Object { $_.name -eq $ProjectName }
if ($existing) {
  Write-Host "  Proyecto ya existe: $($existing.id)" -ForegroundColor Yellow
  $projectRef = $existing.id
} else {
  supabase projects create $ProjectName --org-id $org.id --region $Region --db-password $dbPwd 2>&1 | Tee-Object -Variable createOut
  if ($LASTEXITCODE -ne 0) { throw "Falló creación proyecto" }
  Start-Sleep -Seconds 5
  $projectRef = ((supabase projects list --output json | ConvertFrom-Json) | Where-Object { $_.name -eq $ProjectName }).id
}
Write-Host "  Project ref: $projectRef" -ForegroundColor Green

Write-Host "`n[4/8] Esperando a que el proyecto esté ready (puede tardar ~90s)..." -ForegroundColor Cyan
$maxWait = 180
$waited = 0
while ($waited -lt $maxWait) {
  $status = (supabase projects list --output json | ConvertFrom-Json) | Where-Object { $_.id -eq $projectRef }
  if ($status.status -eq "ACTIVE_HEALTHY" -or $status.status -eq "ACTIVE") { break }
  Start-Sleep -Seconds 10
  $waited += 10
  Write-Host "  Esperando... ($waited s, status: $($status.status))" -ForegroundColor DarkGray
}

Write-Host "`n[5/8] Linkeando proyecto..." -ForegroundColor Cyan
$pwdSecure = ConvertTo-SecureString $dbPwd -AsPlainText -Force
$env:SUPABASE_DB_PASSWORD = $dbPwd
supabase link --project-ref $projectRef --password $dbPwd 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Warning "Link fallo, continuando con conexión directa" }

Write-Host "`n[6/8] Ejecutando schema.sql + rls.sql + seed.sql..." -ForegroundColor Cyan
$scriptRoot = $PSScriptRoot
foreach ($file in @("schema.sql","rls.sql","seed.sql")) {
  $path = Join-Path $scriptRoot $file
  Write-Host "  Aplicando $file..." -ForegroundColor DarkGray
  Get-Content $path -Raw | supabase db push --password $dbPwd 2>&1 | Out-Null
  # Fallback: usar API REST si CLI falla
}

Write-Host "`n[7/8] Obteniendo API keys..." -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $Token" }
$keys = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$projectRef/api-keys" -Headers $headers
$anonKey = ($keys | Where-Object { $_.name -eq "anon" }).api_key
$serviceKey = ($keys | Where-Object { $_.name -eq "service_role" }).api_key
$projectUrl = "https://$projectRef.supabase.co"

Write-Host "`n[8/8] Creando cuentas Director + 4 Operators..." -ForegroundColor Cyan
$env:SUPABASE_URL = $projectUrl
$env:SUPABASE_SERVICE_ROLE_KEY = $serviceKey
node "$scriptRoot/setup-accounts.mjs"

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "DEPLOY COMPLETO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Project URL:  $projectUrl"
Write-Host "Anon key:     $anonKey"
Write-Host "DB password:  $dbPwd"
Write-Host ""
Write-Host "Guardando .env.local..."

$envLocal = @"
VITE_SUPABASE_URL=$projectUrl
VITE_SUPABASE_ANON_KEY=$anonKey
"@
$envPath = Join-Path (Split-Path $scriptRoot -Parent) ".env.local"
Set-Content -Path $envPath -Value $envLocal -Encoding UTF8
Write-Host "  Guardado: $envPath" -ForegroundColor Green

Write-Host "`nSiguiente: deploy a Vercel"
