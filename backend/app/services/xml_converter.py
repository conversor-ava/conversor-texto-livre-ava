from __future__ import annotations

import xml.etree.ElementTree as ET

from app.schemas import QuestionSchema, QuestionSetSchema

DEFAULT_GRADE = "1.0000000"
DEFAULT_PENALTY = "0.3333333"


def _add_text_element(parent: ET.Element, tag: str, content: str, format_: str = "html") -> ET.Element:
    element = ET.SubElement(parent, tag)
    element.set("format", format_)
    text_element = ET.SubElement(element, "text")
    text_element.text = content
    return element


def _build_category_element(category: str) -> ET.Element:
    question_element = ET.Element("question", {"type": "category"})
    category_element = ET.SubElement(question_element, "category")
    text_element = ET.SubElement(category_element, "text")
    text_element.text = f"$course$/top/{category}"
    return question_element


def _build_question_element(question: QuestionSchema) -> ET.Element:
    question_element = ET.Element("question", {"type": "multichoice"})

    name_element = ET.SubElement(question_element, "name")
    name_text_element = ET.SubElement(name_element, "text")
    name_text_element.text = question.name

    _add_text_element(question_element, "questiontext", question.text)

    if question.general_feedback:
        _add_text_element(question_element, "generalfeedback", question.general_feedback)

    ET.SubElement(question_element, "defaultgrade").text = DEFAULT_GRADE
    ET.SubElement(question_element, "penalty").text = DEFAULT_PENALTY
    ET.SubElement(question_element, "hidden").text = "0"
    ET.SubElement(question_element, "single").text = "true"
    ET.SubElement(question_element, "shuffleanswers").text = "true"
    ET.SubElement(question_element, "answernumbering").text = "abc"

    for alternativa in question.answers:
        fraction = "100" if alternativa.is_correct else "0"
        answer_element = ET.SubElement(
            question_element, "answer", {"fraction": fraction, "format": "html"}
        )
        answer_text_element = ET.SubElement(answer_element, "text")
        answer_text_element.text = alternativa.text
        if alternativa.feedback:
            _add_text_element(answer_element, "feedback", alternativa.feedback)

    return question_element


def convert_to_moodle_xml(question_set: QuestionSetSchema) -> str:
    quiz_element = ET.Element("quiz")
    categorias_ja_adicionadas: set[str] = set()

    for question in question_set.questions:
        if question.category and question.category not in categorias_ja_adicionadas:
            quiz_element.append(_build_category_element(question.category))
            categorias_ja_adicionadas.add(question.category)
        quiz_element.append(_build_question_element(question))

    ET.indent(quiz_element, space="  ")
    xml_bytes = ET.tostring(quiz_element, encoding="utf-8", xml_declaration=True)
    return xml_bytes.decode("utf-8")