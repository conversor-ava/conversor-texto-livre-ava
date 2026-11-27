from abc import ABC, abstractmethod


class LLMGenerationError(Exception):
    pass


class LLMTimeoutError(LLMGenerationError):
    pass


class LLMProvider(ABC):

    @abstractmethod
    async def generate(self, prompt: str, seed: int | None = None) -> str:
        pass