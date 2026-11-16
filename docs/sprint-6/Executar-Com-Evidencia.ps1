param(
    [Parameter(Mandatory=$true)][string]$Nome,
    [Parameter(Mandatory=$true)][string]$Casos,
    [Parameter(Mandatory=$true)][string]$Diretorio,
    [Parameter(Mandatory=$true)][string]$Executavel,
    [string[]]$Argumentos = @(),
    [string]$Esperado = 'Código de saída zero; todas as verificações aprovadas.'
)
$ErrorActionPreference = 'Continue'
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$evidencia = Join-Path $PSScriptRoot "evidencias/$Nome.log"
$inicio = [DateTimeOffset]::Now.ToString('o')
$sha = git -C $raiz rev-parse HEAD
$utf8 = New-Object System.Text.UTF8Encoding($false)
$cabecalho = "Casos: $Casos`nInício: $inicio`nCommit base: $sha (árvore de trabalho inclui testes Sprint 6)`nAmbiente: Windows / PowerShell $($PSVersionTable.PSVersion)`nDiretório: $Diretorio`nComando: $Executavel $($Argumentos -join ' ')`nEsperado: $Esperado`n--- saída original ---`n"
[IO.File]::WriteAllText($evidencia, $cabecalho, $utf8)
Push-Location $Diretorio
try {
    $global:LASTEXITCODE = 0
    & $Executavel @Argumentos 2>&1 | ForEach-Object {
        $linha = $_.ToString()
        [IO.File]::AppendAllText($evidencia, "$linha`n", $utf8)
        Write-Output $linha
    }
    $codigo = $LASTEXITCODE
    if (-not $?) { if ($codigo -eq 0) { $codigo = 1 } }
} catch {
    $codigo = 127
    [IO.File]::AppendAllText($evidencia, "$($_.Exception.Message)`n", $utf8)
} finally { Pop-Location }
$estado = if ($codigo -eq 0) { 'passou (confirmar contagens na saída)' } else { 'falhou ou bloqueado; classificar pela causa no relatório' }
[IO.File]::AppendAllText($evidencia, "--- fim ---`nFim: $([DateTimeOffset]::Now.ToString('o'))`nCódigo: $codigo`nEstado do comando: $estado`nEvidência: docs/sprint-6/evidencias/$Nome.log`n", $utf8)
Write-Output "Evidência: $evidencia; código: $codigo"
exit $codigo
