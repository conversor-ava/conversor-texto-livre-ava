$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "  Conversor Texto Livre para AVA"
Write-Host "  Configuracao do Ollama - Windows"
Write-Host "========================================"
Write-Host ""

$ollama = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollama) {
    Write-Host "ERRO: Ollama nao encontrado."
    Write-Host ""
    Write-Host "Instale o Ollama em:"
    Write-Host "https://ollama.com/download"
    exit 1
}

Write-Host "Ollama encontrado."
& $ollama.Source --version

Write-Host ""
Write-Host "Verificando conexao com o Ollama..."

try {
    Invoke-RestMethod `
        -Uri "http://127.0.0.1:11434/api/tags" `
        -Method Get `
        -TimeoutSec 10 | Out-Null
}
catch {
    Write-Host "ERRO: O servico Ollama nao esta respondendo."
    Write-Host ""
    Write-Host "Inicie o Ollama e tente novamente."
    exit 1
}

Write-Host "Servico Ollama funcionando."

Write-Host ""
Write-Host "========================================"
Write-Host "  Baixando modelo Llama 3.2"
Write-Host "========================================"

& $ollama.Source pull llama3.2:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao baixar llama3.2."
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Baixando modelo de embeddings"
Write-Host "========================================"

& $ollama.Source pull nomic-embed-text:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao baixar nomic-embed-text."
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Verificando modelos instalados"
Write-Host "========================================"

& $ollama.Source list

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Nao foi possivel listar os modelos."
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Configuracao concluida!"
Write-Host "========================================"

Write-Host ""
Write-Host "Modelos preparados:"
Write-Host "- llama3.2:latest"
Write-Host "- nomic-embed-text:latest"
Write-Host ""
Write-Host "O ambiente Ollama esta pronto para uso."