# AVA Studio — Frontend

Frontend do **Conversor Inteligente Texto Livre para AVA**. React + TypeScript + Vite, com fluxo independente de IA, sugestões opcionais via Ollama e RAG, revisão docente e exportação Moodle XML.

## Estrutura

- `src/pages`: telas de preparação, revisão e exportação.
- `src/components/layout`: navegação e etapas.
- `src/components/forms`: envio de documento e configuração de geração.
- `src/components/questions`: editor de questões, alternativas e feedback.
- `src/components/ui`: mensagens de estado.
- `src/hooks`: contexto compartilhado de avaliação.
- `src/services`: chamadas à API FastAPI.
- `src/types`: contratos TypeScript.
- `src/utils`: validações locais.
- `src/tests`: testes unitários, de componente e de integração da API simulada.

## Executar

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. Inicie o FastAPI separadamente em `http://127.0.0.1:8000`. O Vite encaminha `/api` e `/health` ao backend em desenvolvimento.

**Rode `npm install` para gerar `package-lock.json` e versione esse arquivo.** Depois de versionado, recomendamos trocar o passo de instalação do workflow por `npm ci` para builds reproduzíveis.

Opcionalmente, configure `VITE_API_URL` no `.env` para usar uma URL pública em vez do proxy Vite. **Nunca coloque credenciais no `.env` do frontend.**

## Endpoints usados

| Ação | Endpoint | IA obrigatória? |
| --- | --- | --- |
| Saúde | `GET /health` | Não |
| Extração de PDF, DOCX ou TXT | `POST /api/extract-text` | Não |
| Sugestões simples | `POST /api/suggestions` | Sim, neste caminho |
| Sugestões com RAG | `POST /api/rag/suggestions` | Sim, neste caminho |
| Exportação Moodle XML | `POST /api/convert` | **Não** |

No fluxo manual, o professor cria as questões diretamente no editor e exporta sem Ollama, RAG ou persistência.

## CI e qualidade

O workflow **na raiz do monorepo** `.github/workflows/frontend-ci.yml` executa em push e PR modificando o frontend:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

O workflow utiliza `npm install` enquanto não existe lockfile no pacote. Após gerar e versionar `frontend/package-lock.json`, altere a etapa para `npm ci`.

## Escopo atual

A revisão é feita no frontend antes do XML. Histórico e persistência MySQL não foram incluídos, pois dependem da API de histórico do backend. O download ser gerado corretamente não garante importação no Moodle; valide o arquivo em uma instância real do Moodle.

## Integrar ao monorepo existente

Copie **o conteúdo** da pasta `frontend/` deste pacote para a pasta `frontend/` existente, sem substituir código não revisado da equipe. Copie `.github/workflows/frontend-ci.yml` para a `.github/workflows/` da **raiz do repositório**. Não crie uma `.github/` dentro do frontend.
