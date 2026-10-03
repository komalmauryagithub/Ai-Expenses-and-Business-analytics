<?php

namespace App\Services\AI;

class NullAIProvider implements AIProviderInterface
{
    public function isConfigured(): bool
    {
        return false;
    }

    public function getProviderName(): string
    {
        return 'none';
    }

    public function generateResponse(string $systemPrompt, string $userPrompt, array $conversationHistory = []): string
    {
        return "The AI Financial Assistant service is currently not configured or disabled in system environment settings. " .
               "To enable real-time natural language explanations, please configure `AI_PROVIDER` (e.g., `gemini` or `openai`) and supply a valid API key in backend `.env`.";
    }
}
