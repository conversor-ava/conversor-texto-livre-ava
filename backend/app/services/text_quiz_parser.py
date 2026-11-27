from __future__ import annotations

import re

from app.schemas import AnswerSchema, QuestionSchema, QuestionSetSchema

QUESTION_START_RE = re.compile(
    r"^(?:(?:quest[ãa]o|pergunta|item)\s*(\d+)[\s.:\-)—]*|(\d+)[\s.:\-)—]+)(.*)$",
    re.IGNORECASE,
)
OPTION_START_RE = re.compile(
    r"^([a-z]|[0-9]+)[\s.:\-)—]+(.*)$",
    re.IGNORECASE,
)
GABARITO_LINE_RE = re.compile(
    r"^(?:gabarito|resposta|correta|resposta\s+correta)[\s.:\-)—]+(.*)$",
    re.IGNORECASE,
)
FEEDBACK_LINE_RE = re.compile(
    r"^(?:feedback|explica[çc][ãa]o|justificativa)[\s.:\-)—]+(.*)$",
    re.IGNORECASE,
)
INLINE_CORRECT_TAG_RE = re.compile(
    r"(?:\s*\(corret[ao]\)|\s*\[x\]|\s*\[corret[ao]\]|\s*<corret[ao]>|\s*\{corret[ao]\})",
    re.IGNORECASE,
)


def _clean_option_text(text: str) -> tuple[str, bool]:
    is_correct = False
    cleaned = text.strip()
    if cleaned.startswith("*") and len(cleaned) > 1:
        is_correct = True
        cleaned = cleaned.lstrip("*").strip()
    if cleaned.endswith("*") and len(cleaned) > 1:
        is_correct = True
        cleaned = cleaned.rstrip("*").strip()
    if INLINE_CORRECT_TAG_RE.search(cleaned):
        is_correct = True
        cleaned = INLINE_CORRECT_TAG_RE.sub("", cleaned).strip()
    return cleaned, is_correct


def parse_free_text_questions(
    texto: str,
    categoria_padrao: str | None = None,
) -> QuestionSetSchema:
    linhas = [linha.strip() for linha in texto.strip().splitlines()]
    linhas = [linha for linha in linhas if linha]

    if not linhas:
        raise ValueError("O texto fornecido está vazio.")

    blocos_brutos: list[list[str]] = []
    bloco_atual: list[str] = []

    for linha in linhas:
        if QUESTION_START_RE.match(linha):
            if bloco_atual:
                blocos_brutos.append(bloco_atual)
            bloco_atual = [linha]
        else:
            if not bloco_atual:
                bloco_atual = [linha]
            else:
                bloco_atual.append(linha)

    if bloco_atual:
        blocos_brutos.append(bloco_atual)

    questoes: list[QuestionSchema] = []

    for idx, bloco in enumerate(blocos_brutos, start=1):
        primeira_linha = bloco[0]
        match_q = QUESTION_START_RE.match(primeira_linha)

        if match_q:
            num = match_q.group(1) or match_q.group(2) or str(idx)
            titulo = f"Questão {num}"
            enunciado_inicial = match_q.group(3).strip()
        else:
            titulo = f"Questão {idx}"
            enunciado_inicial = primeira_linha

        enunciado_linhas: list[str] = [enunciado_inicial] if enunciado_inicial else []
        alternativas_brutas: list[tuple[str, str, bool]] = []
        gabarito_explícito: str | None = None
        feedback_questao: str | None = None

        em_alternativas = False

        for linha in bloco[1:]:
            match_gab = GABARITO_LINE_RE.match(linha)
            if match_gab:
                gabarito_explícito = match_gab.group(1).strip().upper()
                continue

            match_feed = FEEDBACK_LINE_RE.match(linha)
            if match_feed:
                feedback_questao = match_feed.group(1).strip()
                continue

            match_opt = OPTION_START_RE.match(linha)
            if match_opt:
                em_alternativas = True
                rotulo = match_opt.group(1).upper()
                texto_opt, correta_inline = _clean_option_text(match_opt.group(2))
                alternativas_brutas.append((rotulo, texto_opt, correta_inline))
            else:
                if not em_alternativas:
                    enunciado_linhas.append(linha)
                else:
                    if alternativas_brutas:
                        rotulo_ant, txt_ant, corr_ant = alternativas_brutas[-1]
                        alternativas_brutas[-1] = (rotulo_ant, f"{txt_ant} {linha}".strip(), corr_ant)

        texto_enunciado = " ".join(enunciado_linhas).strip()
        if not texto_enunciado:
            texto_enunciado = f"Enunciado da {titulo}"

        if len(alternativas_brutas) < 2:
            raise ValueError(
                f"{titulo} não possui alternativas suficientes para múltipla escolha (mínimo de 2)."
            )

        respostas_finais: list[AnswerSchema] = []

        letra_correta_gabarito = None
        if gabarito_explícito:
            letras_encontradas = re.findall(r"[A-Z0-9]+", gabarito_explícito)
            if letras_encontradas:
                letra_correta_gabarito = letras_encontradas[0]

        qtd_corretas = 0
        for rotulo, texto_alt, correta_inline in alternativas_brutas:
            is_correta = correta_inline
            if letra_correta_gabarito and rotulo == letra_correta_gabarito:
                is_correta = True

            if is_correta:
                qtd_corretas += 1

            respostas_finais.append(
                AnswerSchema(
                    text=texto_alt or f"Alternativa {rotulo}",
                    is_correct=is_correta,
                    feedback= "",
                )
            )

        if qtd_corretas == 0:
            raise ValueError(
                f"{titulo} não possui gabarito definido. Indique a alternativa correta com *, (correta) ou 'Gabarito: [Letra]'."
            )
        if qtd_corretas > 1:
            raise ValueError(
                f"{titulo} possui mais de uma alternativa marcada como correta."
            )

        questoes.append(
            QuestionSchema(
                name=titulo,
                text=texto_enunciado,
                answers=respostas_finais,
                general_feedback=feedback_questao or "",
                category=categoria_padrao,
            )
        )

    if not questoes:
        raise ValueError("Nenhuma questão pôde ser identificada no texto informado.")

    return QuestionSetSchema(questions=questoes)