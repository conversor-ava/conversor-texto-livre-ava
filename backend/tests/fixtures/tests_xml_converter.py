import xml.etree.ElementTree as ET

from app.schemas import QuestionSetSchema
from app.services import convert_to_moodle_xml


def _question_set_basico(category: str | None = None) -> QuestionSetSchema:
    return QuestionSetSchema(
        questions=[
            {
                "name": "capital-franca",
                "text": "Qual e a capital da Franca?",
                "answers": [
                    {"text": "Paris", "is_correct": True, "feedback": "Correto!"},
                    {"text": "Londres", "is_correct": False},
                    {"text": "Berlim", "is_correct": False},
                ],
                "general_feedback": "A capital da Franca e Paris.",
                "category": category,
            }
        ]
    )


def test_xml_gerado_e_valido_e_tem_raiz_quiz() -> None:
    xml_string = convert_to_moodle_xml(_question_set_basico())

    raiz = ET.fromstring(xml_string)

    assert raiz.tag == "quiz"


def test_questao_multichoice_tem_nome_e_enunciado() -> None:
    xml_string = convert_to_moodle_xml(_question_set_basico())
    raiz = ET.fromstring(xml_string)

    questao = raiz.find("question[@type='multichoice']")
    assert questao is not None
    assert questao.find("name/text").text == "capital-franca"
    assert questao.find("questiontext/text").text == "Qual e a capital da Franca?"


def test_apenas_uma_alternativa_recebe_fraction_100() -> None:
    xml_string = convert_to_moodle_xml(_question_set_basico())
    raiz = ET.fromstring(xml_string)

    questao = raiz.find("question[@type='multichoice']")
    alternativas = questao.findall("answer")

    fractions_corretas = [a for a in alternativas if a.get("fraction") == "100"]
    fractions_erradas = [a for a in alternativas if a.get("fraction") == "0"]

    assert len(alternativas) == 3
    assert len(fractions_corretas) == 1
    assert len(fractions_erradas) == 2
    assert fractions_corretas[0].find("text").text == "Paris"


def test_feedback_da_alternativa_e_incluido_quando_presente() -> None:
    xml_string = convert_to_moodle_xml(_question_set_basico())
    raiz = ET.fromstring(xml_string)

    questao = raiz.find("question[@type='multichoice']")
    alternativa_correta = questao.find("answer[@fraction='100']")

    assert alternativa_correta.find("feedback/text").text == "Correto!"


def test_categoria_gera_elemento_question_type_category() -> None:
    xml_string = convert_to_moodle_xml(_question_set_basico(category="Geografia/Europa"))
    raiz = ET.fromstring(xml_string)

    categoria = raiz.find("question[@type='category']")
    assert categoria is not None
    assert categoria.find("category/text").text == "$course$/top/Geografia/Europa"


def test_sem_categoria_nao_gera_elemento_category() -> None:
    xml_string = convert_to_moodle_xml(_question_set_basico(category=None))
    raiz = ET.fromstring(xml_string)

    assert raiz.find("question[@type='category']") is None


def test_categoria_repetida_nao_duplica_elemento() -> None:
    question_set = QuestionSetSchema(
        questions=[
            {
                "name": "q1",
                "text": "Pergunta 1?",
                "answers": [
                    {"text": "A", "is_correct": True},
                    {"text": "B", "is_correct": False},
                ],
                "category": "Mesma Categoria",
            },
            {
                "name": "q2",
                "text": "Pergunta 2?",
                "answers": [
                    {"text": "C", "is_correct": True},
                    {"text": "D", "is_correct": False},
                ],
                "category": "Mesma Categoria",
            },
        ]
    )

    xml_string = convert_to_moodle_xml(question_set)
    raiz = ET.fromstring(xml_string)

    categorias = raiz.findall("question[@type='category']")
    assert len(categorias) == 1