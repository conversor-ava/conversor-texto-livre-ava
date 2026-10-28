import asyncio
import json

from app.llm.providers import OllamaProvider


async def main():
    texto = """
    A fotossíntese é um processo realizado por plantas,
    algas e algumas bactérias.

    Durante esse processo, a energia luminosa é utilizada
    para produzir compostos orgânicos a partir de
    dióxido de carbono e água.

    Nas plantas, a fotossíntese ocorre principalmente
    nos cloroplastos.
    """

    prompt = f"""
    Você é um especialista em elaboração de questões educacionais.

    Com base exclusivamente no texto abaixo, gere 3 questões
    de múltipla escolha.

    Regras:
    - Cada questão deve possuir 4 alternativas.
    - Apenas uma alternativa deve estar correta.
    - As perguntas devem ser claras e objetivas.
    - Não utilize informações externas ao texto.
    - Retorne exclusivamente JSON válido.
    - Não utilize Markdown.

    Formato obrigatório:

    {{
        "questions": [
            {{
                "question": "Enunciado da questão",
                "alternatives": {{
                    "A": "Alternativa A",
                    "B": "Alternativa B",
                    "C": "Alternativa C",
                    "D": "Alternativa D"
                }},
                "correct_answer": "A"
            }}
        ]
    }}

    Texto-base:
    {texto}
    """

    provedor = OllamaProvider()

    resposta = await provedor.generate(prompt)

    try:
        questoes = json.loads(resposta)
        print(json.dumps(questoes, indent=4, ensure_ascii=False))
    except json.JSONDecodeError:
        print("A IA retornou um JSON inválido:")
        print(resposta)


if __name__ == "__main__":
    asyncio.run(main())