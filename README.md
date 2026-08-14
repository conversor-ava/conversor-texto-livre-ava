# Conversor Inteligente "Texto Livre para AVA"

Geração automatizada de questões de múltipla escolha a partir de texto-base
livre, com entrega em formato **Moodle XML** pronto para importação em lote.

O sistema separa responsabilidades: o LLM produz **apenas o conteúdo semântico**
em JSON, validado por guardrails (Pydantic); a marcação XML é gerada por
**código determinístico**, o que elimina por construção a classe de erros de
sintaxe da geração direta de XML por IA.

## Pipeline

1. **Construção dinâmica do prompt** — montado no servidor, com instrução de saída estrita em JSON
2. **Extração e validação (guardrails)** — validação de esquema com re-tentativa automática e transparente
3. **Conversão determinística** — mapeamento JSON → Moodle XML por código
4. **Entrega** — prévia das questões e download do arquivo

## Stack

| Camada | Tecnologia |
|---|---|
| Apresentação | React + TypeScript |
| Aplicação | Python + FastAPI + Pydantic |
| Conversão | `xml.etree.ElementTree` |
| Persistência | SQLite |
| IA | interface agnóstica ao provedor |

## Estrutura

```
backend/app/schemas/     Guardrails — contrato de validação (Etapa 2)
backend/app/services/    Construtor de prompt e conversor XML (Etapas 1 e 3)
backend/app/llm/         Interface agnóstica ao provedor de LLM
backend/app/db/          Persistência do histórico de gerações
frontend/src/            Interface do docente
docs/                    Artigo, diagramas e decisões de arquitetura
```

## Executando localmente

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env             # preencha a chave do provedor de LLM
uvicorn app.main:app --reload
```

API disponível em `http://localhost:8000` — documentação interativa em `/docs`.

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

### Testes

```bash
cd backend
pytest -q
```

## Contribuindo

Ver `CONTRIBUTING.md` para o fluxo de branches, convenção de commits e processo
de revisão. Merges na `main` exigem pull request aprovado e CI verde.

## Contexto acadêmico

Trabalho de Conclusão de Curso em Engenharia de Software.

- **PFC I** — especificação (concluído)
- **PFC II** — implementação (em andamento)

## Licença

MIT — ver `LICENSE`.