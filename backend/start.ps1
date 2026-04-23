# Arranque simple para API
$ErrorActionPreference = "SilentlyContinue"
$workingDir = "C:\Users\juang\OneDrive\Desktop\Dunita\arrakis-black-market\backend"

# Matar procesos anteriores
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Eliminar DB antigua
Remove-Item "$workingDir\arrakis.db" -Force -ErrorAction SilentlyContinue

# Iniciar
Write-Host "Starting API..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $workingDir -PassThru

Start-Sleep -Seconds 3

# Probar
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/" -TimeoutSec 5
    Write-Host "API running: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "API error: $_" -ForegroundColor Red
}