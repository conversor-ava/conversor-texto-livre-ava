from abc import ABC, abstractmethod


class LLMGenerationError(Exception):
    pass


class LLMProvider(ABC):

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        pass