<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIProvider implements AIProviderInterface
{
    protected ?string $apiKey;
    protected string $model;
    protected int $maxTokens;

    public function __construct()
    {
        $this->apiKey = config('services.ai.openai.api_key', env('OPENAI_API_KEY'));
        $this->model = config('services.ai.openai.model', env('OPENAI_MODEL', 'gpt-4o-mini'));
        $this->maxTokens = (int) config('services.ai.max_response_tokens', 800);
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && is_string($this->apiKey) && strlen(trim($this->apiKey)) > 5;
    }

    public function getProviderName(): string
    {
        return 'openai';
    }

    public function generateResponse(string $systemPrompt, string $userPrompt, array $conversationHistory = []): string
    {
        if (!$this->isConfigured()) {
            throw new \Exception("OpenAI API key is not configured in backend environment.");
        }

        $url = "https://api.openai.com/v1/chat/completions";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Include recent history (max 6 messages)
        if (!empty($conversationHistory)) {
            $recent = array_slice($conversationHistory, -6);
            foreach ($recent as $msg) {
                $role = ($msg['role'] === 'assistant') ? 'assistant' : 'user';
                $messages[] = [
                    'role' => $role,
                    'content' => (string)$msg['content'],
                ];
            }
        }

        $messages[] = ['role' => 'user', 'content' => $userPrompt];

        $payload = [
            'model' => $this->model,
            'messages' => $messages,
            'max_tokens' => $this->maxTokens,
            'temperature' => 0.2,
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($url, $payload);

            if ($response->successful()) {
                $json = $response->json();
                $text = $json['choices'][0]['message']['content'] ?? null;
                if (!empty($text)) {
                    return trim($text);
                }
                Log::warning("OpenAI API returned empty response text: " . json_encode($json));
                throw new \Exception("OpenAI service returned an empty response.");
            }

            Log::error("OpenAI Provider HTTP Error: {$response->status()} - {$response->body()}");
            if ($response->status() === 429) {
                throw new \Exception("OpenAI rate limit or quota exceeded. Please try again later.");
            }
            throw new \Exception("OpenAI provider error (HTTP {$response->status()}).");
        } catch (\Throwable $e) {
            Log::error("OpenAI Exception: {$e->getMessage()}");
            throw $e;
        }
    }
}
