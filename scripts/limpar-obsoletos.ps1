# Apaga os arquivos que a revisão 1.2 das especificações marcou como obsoletos.
# Uso, na raiz do repositório:
#   powershell -ExecutionPolicy Bypass -File scripts\limpar-obsoletos.ps1            (só lista)
#   powershell -ExecutionPolicy Bypass -File scripts\limpar-obsoletos.ps1 -Aplicar   (apaga)
param([switch]$Aplicar)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$especificacoes = Get-ChildItem -Path $raiz -Directory | Where-Object { $_.Name -like 'especifica*' } | Select-Object -First 1
if (-not $especificacoes) { throw "Pasta de especificações não encontrada em $raiz" }

$alvos = @()

# 1. Arquivos com "status: obsoleto" no frontmatter (fora de _arquivo).
Get-ChildItem -Path $especificacoes.FullName -Recurse -Filter *.md |
  Where-Object { $_.FullName -notmatch '\\_arquivo\\' } |
  ForEach-Object {
    $inicio = (Get-Content -Path $_.FullName -TotalCount 5 -Encoding UTF8) -join "`n"
    if ($inicio -match '(?m)^status:\s*obsoleto') { $alvos += $_.FullName }
  }

# 2. HTML do caso de teste na raiz, se a cópia em testes/ existir com o mesmo tamanho.
$htmlRaiz = Get-ChildItem -Path $raiz -File -Filter 'Darklabs-*.html' | Select-Object -First 1
$htmlTeste = Join-Path $raiz 'testes\credit-on-wealth\gabarito-darklab.html'
if ($htmlRaiz -and (Test-Path $htmlTeste) -and ((Get-Item $htmlTeste).Length -eq $htmlRaiz.Length)) {
  $alvos += $htmlRaiz.FullName
}

if (-not $alvos) { Write-Host 'Nada a limpar.'; exit 0 }
Write-Host 'Arquivos obsoletos:'
$alvos | ForEach-Object { Write-Host "  $_" }

if ($Aplicar) {
  $alvos | ForEach-Object { Remove-Item -LiteralPath $_ -Force }
  Write-Host "$($alvos.Count) arquivo(s) apagado(s). Rode 'npm run validar:especificacoes' para conferir."
} else {
  Write-Host "`nNada foi apagado. Rode de novo com -Aplicar para apagar."
}
