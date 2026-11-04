#!/usr/bin/env bash

set -euo pipefail

echo "========================================"
echo "  Conversor Texto Livre para AVA"
echo "  Configuracao do Ollama - Linux"
echo "========================================"
echo

if ! command -v ollama >/dev/null 2>&1; then
    echo "ERRO: Ollama nao encontrado."
    echo
    echo "Instale o Ollama em:"
    echo "https://ollama.com/download"
    exit 1
fi

echo "Ollama encontrado."
ollama --version

echo
echo "Verificando conexao com o Ollama..."

if ! ollama list >/dev/null 2>&1; then
    echo "ERRO: O servico Ollama nao esta respondendo."
    echo
    echo "Inicie o servico e tente novamente."
    echo "Em instalacoes Linux com systemd:"
    echo "sudo systemctl start ollama"
    exit 1
fi

echo "Servico Ollama funcionando."

echo
echo "========================================"
echo "  Baixando modelo Llama 3.2"
echo "========================================"

ollama pull llama3.2:latest

echo
echo "========================================"
echo "  Baixando modelo de embeddings"
echo "========================================"

ollama pull nomic-embed-text:latest

echo
echo "========================================"
echo "  Verificando modelos instalados"
echo "========================================"

ollama list

echo
echo "========================================"
echo "  Configuracao concluida!"
echo "========================================"

echo
echo "Modelos preparados:"
echo "- llama3.2:latest"
echo "- nomic-embed-text:latest"
echo
echo "O ambiente Ollama esta pronto para uso."