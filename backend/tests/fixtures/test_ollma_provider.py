import httpx
import pytest

from app.llm import LLMGenerationError
from app.llm.providers.ollama import OllamaProvider


class _RespostaFalsa:
    def __init__(self, payload: dict, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("erro simulado", request=None, response=self)  # type: ignore[arg-type]

    def json(self) -> dict:
        return self._payload


class _ClienteFalso:
    def __init__(self, resposta: _RespostaFalsa | None = None, excecao: Exception | None = None) -> None:
        self._resposta = resposta
        self._excecao = excecao
        self.chamadas: list[tuple[str, dict]] = []

    async def __aenter__(self) -> "_ClienteFalso":
        return self

    async def __aexit__(self, *args: object) -> None:
        return None

    async def post(self, url: str, json: dict) -> _RespostaFalsa:
        self.chamadas.append((url, json))
        if self._excecao:
            raise self._excecao
        assert self._resposta is not None
        return self._resposta


def _instala_cliente_falso(monkeypatch: pytest.MonkeyPatch, cliente_falso: _ClienteFalso) -> None:
    monkeypatch.setattr(
        "app.llm.providers.ollama.httpx.AsyncClient",
        lambda **kwargs: cliente_falso,
    )


async def test_generate_retorna_texto_da_resposta_do_ollama(monkeypatch: pytest.MonkeyPatch) -> None:
    cliente_falso = _ClienteFalso(resposta=_RespostaFalsa({"response": '{"questions": []}'}))
    _instala_cliente_falso(monkeypatch, cliente_falso)

    provedor = OllamaProvider(model="llama3.2")
    resultado = await provedor.generate("gere questoes")

    assert resultado == '{"questions": []}'
    assert cliente_falso.chamadas[0][1]["model"] == "llama3.2"
    assert cliente_falso.chamadas[0][1]["prompt"] == "gere questoes"
    assert cliente_falso.chamadas[0][1]["stream"] is False


async def test_generate_usa_url_base_configurada(monkeypatch: pytest.MonkeyPatch) -> None:
    cliente_falso = _ClienteFalso(resposta=_RespostaFalsa({"response": "ok"}))
    _instala_cliente_falso(monkeypatch, cliente_falso)

    provedor = OllamaProvider(base_url="http://meu-servidor:11434/")
    await provedor.generate("prompt")

    assert cliente_falso.chamadas[0][0] == "http://meu-servidor:11434/api/generate"


async def test_generate_levanta_erro_quando_conexao_falha(monkeypatch: pytest.MonkeyPatch) -> None:
    cliente_falso = _ClienteFalso(excecao=httpx.ConnectError("conexao recusada"))
    _instala_cliente_falso(monkeypatch, cliente_falso)

    provedor = OllamaProvider()

    with pytest.raises(LLMGenerationError):
        await provedor.generate("prompt")


async def test_generate_levanta_erro_quando_resposta_vazia(monkeypatch: pytest.MonkeyPatch) -> None:
    cliente_falso = _ClienteFalso(resposta=_RespostaFalsa({"response": ""}))
    _instala_cliente_falso(monkeypatch, cliente_falso)

    provedor = OllamaProvider()

    with pytest.raises(LLMGenerationError):
        await provedor.generate("prompt")


async def test_generate_levanta_erro_quando_status_http_e_de_falha(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cliente_falso = _ClienteFalso(resposta=_RespostaFalsa({}, status_code=500))
    _instala_cliente_falso(monkeypatch, cliente_falso)

    provedor = OllamaProvider()

    with pytest.raises(LLMGenerationError):
        await provedor.generate("prompt")