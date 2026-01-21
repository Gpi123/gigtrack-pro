# Script para limpar credenciais do GitHub no Windows
# Execute este script no PowerShell como Administrador

Write-Host "Limpando credenciais do GitHub..." -ForegroundColor Yellow

# Limpar credenciais do Git Credential Manager
git credential-manager-core erase
host=github.com
protocol=https

Write-Host "Credenciais limpas!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute: git push -u origin main" -ForegroundColor Cyan
Write-Host "Quando pedir credenciais, use:" -ForegroundColor Cyan
Write-Host "  Username: Gpi123" -ForegroundColor Cyan
Write-Host "  Password: Seu Personal Access Token" -ForegroundColor Cyan
