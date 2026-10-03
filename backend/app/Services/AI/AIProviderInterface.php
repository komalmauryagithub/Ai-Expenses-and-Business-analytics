<?php

namespace App\Services\AI;

interface AIProviderInterface
{
    /**
     * Generate AI response given system prompt, user prompt, and optional conversation history.
     */
    public function generateResponse(string $systemPrompt, string $userPrompt, array $conversationHistory = []): string;

    /**
     * Return whether provider has a valid API key and active configuration.
     */
    public function isConfigured(): bool;

    /**
     * Return unique provider identifier string (e.g. 'gemini', 'openai', 'null').
     */
    public function getProviderName(): string;
}
