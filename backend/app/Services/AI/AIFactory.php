<?php

namespace App\Services\AI;

class AIFactory
{
    public static function create(): AIProviderInterface
    {
        $providerName = strtolower(trim(config('services.ai.provider', env('AI_PROVIDER', 'gemini'))));

        if ($providerName === 'gemini') {
            $provider = new GeminiProvider();
            if ($provider->isConfigured()) {
                return $provider;
            }
        }

        if ($providerName === 'openai') {
            $provider = new OpenAIProvider();
            if ($provider->isConfigured()) {
                return $provider;
            }
        }

        // Check if gemini has key as fallback
        $gemini = new GeminiProvider();
        if ($gemini->isConfigured()) {
            return $gemini;
        }

        // Check if openai has key as fallback
        $openai = new OpenAIProvider();
        if ($openai->isConfigured()) {
            return $openai;
        }

        return new NullAIProvider();
    }
}
