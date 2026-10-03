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
        if (!$this->isConfigured()) {
            throw new \Exception("Gemini AI API key is not configured in backend environment.");
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        // Format system instruction and conversation messages for Gemini API
        $contents = [];

        // Include recent conversation history (max 6 messages) if available
        if (!empty($conversationHistory)) {
            $recent = array_slice($conversationHistory, -6);
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

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($url, $payload);

            if ($response->successful()) {
                $json = $response->json();
                $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                if (!empty($text)) {
                    return trim($text);
                }
                Log::warning("Gemini AI API returned empty candidates content: " . json_encode($json));
                throw new \Exception("Gemini AI service returned an empty response.");
            }

            Log::error("Gemini AI Provider HTTP Error: {$response->status()} - {$response->body()}");
            if ($response->status() === 429) {
                throw new \Exception("Gemini AI quota or rate limit exceeded. Please try again later.");
            }
            throw new \Exception("Gemini AI provider error (HTTP {$response->status()}).");
        } catch (\Throwable $e) {
            Log::error("Gemini AI Exception: {$e->getMessage()}");
            throw $e;
        }
    }
}
