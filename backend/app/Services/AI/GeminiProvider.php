<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiProvider implements AIProviderInterface
{
    protected ?string $apiKey;
    protected string $model;
    protected int $maxTokens;

    public function __construct()
    {
        $this->apiKey = config('services.ai.gemini.api_key', env('GEMINI_API_KEY'));
        $this->model = config('services.ai.gemini.model', env('GEMINI_MODEL', 'gemini-1.5-flash'));
        $this->maxTokens = (int) config('services.ai.max_response_tokens', 800);
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && is_string($this->apiKey) && strlen(trim($this->apiKey)) > 5;
    }

    public function getProviderName(): string
    {
        return 'gemini';
    }

    public function generateResponse(string $systemPrompt, string $userPrompt, array $conversationHistory = []): string
    {
        @set_time_limit(120);

        if (!$this->isConfigured()) {
            throw new \Exception("Gemini AI API key is not configured in backend environment.");
        }

        // Format system instruction and conversation messages for Gemini API
        $contents = [];

        // Include recent conversation history (max 4 messages) if available
        if (!empty($conversationHistory)) {
            $recent = array_slice($conversationHistory, -4);
            foreach ($recent as $msg) {
                $role = ($msg['role'] === 'assistant') ? 'model' : 'user';
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => (string)$msg['content']]],
                ];
            }
        }

        // Add current user prompt
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userPrompt]],
        ];

        $payload = [
            'system_instruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'maxOutputTokens' => $this->maxTokens,
                'temperature' => 0.2,
            ],
        ];

        $candidateModels = array_unique([
            $this->model,
            'gemini-flash-latest',
            'gemini-flash-lite-latest',
        ]);

        $lastException = null;

        foreach ($candidateModels as $currentModel) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$currentModel}:generateContent?key={$this->apiKey}";

            try {
                $response = Http::withoutVerifying()
                    ->withOptions([
                        'force_ip_resolve' => 'v4',
                    ])
                    ->withHeaders([
                        'Content-Type' => 'application/json',
                    ])
                    ->timeout(18)
                    ->post($url, $payload);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if (!empty($text)) {
                        return trim($text);
                    }
                }

                if ($response->status() === 404) {
                    continue;
                }

                Log::error("Gemini AI Provider HTTP Error: {$response->status()} - {$response->body()}");
            } catch (\Throwable $e) {
                $lastException = $e;
                Log::warning("Gemini AI attempt for {$currentModel} failed: {$e->getMessage()}");
            }
        }

        if ($lastException) {
            throw $lastException;
        }

        throw new \Exception("Gemini AI service is temporarily unavailable. Please try again in a moment.");
    }
}
