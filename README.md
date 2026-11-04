# Conversor Inteligente Texto Livre para AVA

Aplicação web para criação, revisão e exportação de questões avaliativas no formato **Moodle XML**, permitindo que docentes transformem materiais didáticos em questões de múltipla escolha.

O sistema oferece criação manual de questões e geração assistida por inteligência artificial, utilizando modelos executados localmente pelo **Ollama**.

A inteligência artificial é opcional. A conversão para Moodle XML é realizada de forma determinística pelo backend, independentemente do método utilizado para criar as questões.

## Funcionalidades

- Criação manual de questões de múltipla escolha.
- Geração de sugestões com inteligência artificial.
- Geração assistida por recuperação semântica (RAG).
- Entrada de texto-base por digitação ou colagem.
- Extração de conteúdo de arquivos PDF, DOCX e TXT.
- Configuração da quantidade de questões e nível de dificuldade.
- Definição do número de alternativas por questão.
- Edição de enunciados, alternativas, gabaritos e feedbacks.
- Organização das questões por categorias.
- Validação das questões antes da exportação.
- Exportação de avaliações no formato Moodle XML.
- Interface responsiva para preparação, revisão e exportação.

## Tecnologias utilizadas

| Camada | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI, Pydantic |
| Banco de dados | MySQL, SQLAlchemy |
| Inteligência artificial | Ollama, Llama 3.2 |
| Embeddings | nomic-embed-text |
| Recuperação semântica | RAG |
| Exportação | Moodle XML |

## Arquitetura

O projeto separa a geração do conteúdo das questões da conversão para Moodle XML.

A aplicação utiliza o seguinte fluxo:

```text
Material didático
       |
       v
Frontend React
       |
       v
Backend FastAPI
       |
       +---------------------+
       |                     |
       v                     v
Criação manual       Geração assistida
       |               Ollama / RAG
       |                     |
       +----------+----------+
                  |
                  v
          Questões estruturadas
                  |
                  v
           Validação Pydantic
                  |
                  v
          Conversor determinístico
                  |
                  v
              Moodle XML
                  |
                  v
          Importação no Moodle
```

A utilização de inteligência artificial não é necessária para a criação manual nem para a conversão das questões.

A geração assistida utiliza modelos de linguagem para produzir o conteúdo das questões, enquanto o backend é responsável pela validação estrutural e pela transformação dos dados em Moodle XML.

Essa separação permite que a exportação seja independente da geração por IA.

## Estrutura do projeto

```text
conversor-texto-livre-ava/
├── .github/
│   └── workflows/
├── backend/
│   ├── app/
│   ├── tests/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── README.md
├── scripts/
│   ├── setup_ollama.sh
│   └── setup_ollama.ps1
├── docs/
├── docker-compose.yml
├── LICENSE
└── README.md
```

## Pré-requisitos

Para executar o projeto, são necessárias as seguintes ferramentas:

- Git.
- Python 3.10 ou superior.
- Node.js e npm.
- MySQL, conforme a configuração do backend.
- Ollama, para utilizar funcionalidades de IA.

O Ollama é opcional para o funcionamento do modo manual.

## Instalação e execução

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd conversor-texto-livre-ava
```

Substitua `<URL_DO_REPOSITORIO>` pelo endereço de clonagem do projeto no GitHub.

### 2. Preparar o backend

Na raiz do projeto, crie um ambiente virtual Python.

**Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Acesse a pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
pip install -e .
```

Configure as variáveis de ambiente necessárias ao backend conforme os arquivos de exemplo do projeto.

As credenciais do banco de dados devem permanecer em arquivos locais não versionados.

Para iniciar a API FastAPI:

```bash
uvicorn app.main:app --reload
```

Por padrão, a API estará disponível em:

```text
http://127.0.0.1:8000
```

A documentação interativa poderá ser acessada em:

```text
http://127.0.0.1:8000/docs
```

### 3. Preparar o frontend

Abra outro terminal na raiz do repositório e acesse a pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm ci
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A interface estará disponível em:

```text
http://localhost:5173
```

Durante o desenvolvimento, o Vite utiliza um proxy para encaminhar as requisições `/api` e `/health` ao FastAPI.

O endereço da API também pode ser configurado pela variável de ambiente `VITE_API_URL`.

Um exemplo está disponível em `frontend/.env.example`.

## Configuração do Ollama

O projeto utiliza dois modelos executados localmente:

| Modelo | Finalidade |
|---|---|
| `llama3.2:latest` | Geração de sugestões de questões |
| `nomic-embed-text:latest` | Geração de embeddings para RAG |

Para facilitar a preparação do ambiente, o repositório disponibiliza scripts para **Linux e Windows**.

Os scripts verificam se o Ollama está instalado e em execução e, em seguida, baixam os modelos necessários.

Os modelos são armazenados localmente e não fazem parte do repositório Git.

### 1. Instalar o Ollama

Acesse o site oficial:

https://ollama.com/download

Faça a instalação correspondente ao seu sistema operacional.

O serviço Ollama precisa estar em execução antes de utilizar os scripts.

### 2. Configuração no Linux

Abra um terminal na **raiz do repositório**.

Conceda permissão de execução ao script:

```bash
chmod +x scripts/setup_ollama.sh
```

Execute:

```bash
./scripts/setup_ollama.sh
```

O script verificará o Ollama e baixará automaticamente os modelos:

```text
llama3.2:latest
nomic-embed-text:latest
```

Caso o serviço esteja parado, em instalações Linux com systemd é possível iniciá-lo com:

```bash
sudo systemctl start ollama
```

Depois, execute novamente o script de preparação.

### 3. Configuração no Windows

Abra o **PowerShell** na raiz do repositório.

Execute:

```powershell
.\scripts\setup_ollama.ps1
```

Se a política de execução impedir a inicialização do script, utilize:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Depois, execute novamente:

```powershell
.\scripts\setup_ollama.ps1
```

A alteração de política com `Scope Process` vale somente para a sessão atual do PowerShell, desde que não exista uma política administrativa mais restritiva.

O Ollama deve estar instalado e em execução antes de iniciar o script.

### 4. Verificar os modelos instalados

Após executar o script correspondente ao seu sistema operacional, utilize:

```bash
ollama list
```

A saída deverá incluir:

```text
llama3.2:latest
nomic-embed-text:latest
```

Para verificar os modelos carregados no momento:

```bash
ollama ps
```

É normal que o comando não apresente modelos quando nenhum estiver em execução.

### 5. Testar o Ollama

Para testar o modelo de geração:

```bash
ollama run llama3.2:latest "Responda apenas: Olá"
```

Para verificar se a API local está respondendo, acesse:

```text
http://localhost:11434/api/tags
```

Os downloads iniciais precisam de conexão com a internet. Após a instalação, os modelos podem ser executados localmente.

**Importante:** a instalação do `nomic-embed-text` prepara o modelo de embeddings, mas a funcionalidade RAG também depende da configuração dos componentes de recuperação semântica do backend.

## Como utilizar

### Modo manual

Permite criar questões sem utilizar modelos de inteligência artificial.

1. Acesse a interface do conversor.
2. Selecione o modo **Manual**.
3. Configure a quantidade de alternativas.
4. Crie e edite as questões.
5. Marque a alternativa correta e preencha os feedbacks.
6. Valide as questões.
7. Exporte o arquivo Moodle XML.

Esse modo não exige Ollama.

### IA simples

Utiliza o Llama 3.2, executado pelo Ollama, para sugerir questões com base no material fornecido.

1. Insira um texto-base ou envie um documento.
2. Selecione **IA simples**.
3. Configure a quantidade de questões, dificuldade e alternativas.
4. Solicite a geração.
5. Revise as questões sugeridas.
6. Exporte o arquivo Moodle XML.

O Ollama deve estar funcionando e o modelo de geração deve estar disponível.

### IA + RAG

Combina geração assistida por inteligência artificial com recuperação semântica de informações.

1. Insira o material de referência.
2. Selecione **IA + RAG**.
3. Informe o tema da busca semântica.
4. Configure os parâmetros de geração e recuperação.
5. Solicite a geração.
6. Revise o conteúdo retornado.
7. Exporte as questões.

Esse modo depende da configuração dos componentes de RAG no backend.

## Revisão das questões

Antes da exportação, o docente pode revisar e modificar as questões produzidas.

A interface permite:

- Editar o nome e o enunciado das questões.
- Definir categorias.
- Adicionar e remover alternativas.
- Selecionar a resposta correta.
- Editar os feedbacks individuais.
- Informar feedback geral.
- Adicionar ou excluir questões.

O sistema verifica a estrutura das questões antes de permitir a exportação.

Cada questão deve possuir entre **2 e 8 alternativas**, com exatamente uma resposta correta.

## Exportação para Moodle

O sistema produz um arquivo no formato **Moodle XML**, destinado à importação de questões no banco de questões de um curso Moodle.

Após gerar o arquivo:

1. Acesse o curso no Moodle.
2. Abra o **Banco de questões**.
3. Selecione a opção **Importar**.
4. Escolha o formato **Moodle XML**.
5. Selecione o arquivo gerado pelo conversor.
6. Confirme a importação e confira as questões.

A revisão docente é recomendada antes da utilização das questões em avaliações reais.

## Verificações do frontend

Na pasta `frontend`, execute:

```bash
npm run ci
```

O comando executa as verificações configuradas no projeto.

Também é possível executar cada etapa separadamente:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Observações

- Os modelos Ollama não são armazenados no repositório Git.
- Os scripts de preparação não substituem a instalação do Ollama.
- Credenciais e arquivos `.env` reais não devem ser publicados.
- O desempenho da geração com IA depende dos recursos disponíveis na máquina.
- O modo manual funciona sem necessidade de modelos de inteligência artificial.
- As questões produzidas com auxílio de IA devem ser revisadas pelo docente.
- A conversão para Moodle XML é responsabilidade do backend e não depende de geração de XML por inteligência artificial.

## Contexto acadêmico

Trabalho de Conclusão de Curso em **Engenharia de Software da Universidade de Vassouras**.

O desenvolvimento está organizado em duas etapas acadêmicas:

- **PFC I** — especificação (concluído).
- **PFC II** — implementação (em andamento).

O projeto busca facilitar a elaboração de questões avaliativas para ambientes virtuais de aprendizagem, combinando automação, validação estrutural e controle docente sobre o conteúdo final.

## Licença

MIT — ver [`LICENSE`](LICENSE).
