from app.db.models import Geracao, StatusGeracao
from app.repositories.geracao import montar_geracao
from app.schemas import QuestionSetSchema


def _criar_conjunto() -> QuestionSetSchema:
    return QuestionSetSchema.model_validate(
        {
            "questions": [
                {
                    "name": "Fotossintese 1",
                    "text": "Qual organela realiza a fotossintese?",
                    "category": "Biologia/Fotossintese",
                    "general_feedback": "Revise o papel dos cloroplastos.",
                    "answers": [
                        {"text": "Mitocondria", "is_correct": False,
                         "feedback": "A mitocondria faz respiracao celular."},
                        {"text": "Cloroplasto", "is_correct": True,
                         "feedback": "O cloroplasto contem clorofila."},
                        {"text": "Ribossomo", "is_correct": False,
                         "feedback": "O ribossomo sintetiza proteinas."},
                    ],
                },
                {
                    "name": "Fotossintese 2",
                    "text": "Qual gas e absorvido na fotossintese?",
                    "category": None,
                    "general_feedback": None,
                    "answers": [
                        {"text": "Oxigenio", "is_correct": False,
                         "feedback": "O oxigenio e liberado."},
                        {"text": "Nitrogenio", "is_correct": False,
                         "feedback": "Nao participa diretamente."},
                        {"text": "Gas carbonico", "is_correct": True,
                         "feedback": "O CO2 e a fonte de carbono."},
                    ],
                },
            ]
        }
    )


def test_montar_geracao_mapeia_campos_da_questao():
    ...

def test_montar_geracao_mapeia_campos_das_alternativas():
    ...

def test_montar_geracao_define_status_concluida():
    ...

def test_montar_geracao_copia_parametros():
    ...

def test_montar_geracao_preserva_a_ordem():
    ...