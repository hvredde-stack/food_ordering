# One-shot Vercel setup + deploy.
# Prerequisite: vercel CLI installed and `vercel login` already done.

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env.local")) {
  Write-Error ".env.local not found. Run from project root."
  exit 1
}

# 1. Link project
if (-not (Test-Path ".vercel/project.json")) {
  Write-Host "Linking to Vercel..." -ForegroundColor Cyan
  vercel link --yes
} else {
  Write-Host "Project already linked." -ForegroundColor DarkGray
}

# 2. Upload env vars from .env.local
Write-Host "Uploading env vars..." -ForegroundColor Cyan
$envs = @("production", "preview", "development")

foreach ($line in Get-Content .env.local) {
  $t = $line.Trim()
  if ($t -eq "" -or $t.StartsWith("#")) { continue }
  $eq = $t.IndexOf("=")
  if ($eq -lt 1) { continue }
  $name = $t.Substring(0, $eq).Trim()
  $value = $t.Substring($eq + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  foreach ($e in $envs) {
    & vercel env rm $name $e --yes 2>$null | Out-Null
    Write-Output $value | vercel env add $name $e | Out-Null
  }
  Write-Host "  [ok] $name" -ForegroundColor Green
}

# 3. Deploy to production
Write-Host "Deploying to production..." -ForegroundColor Cyan
vercel deploy --prod --yes
