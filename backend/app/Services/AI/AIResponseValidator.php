<?php

namespace App\Services\AI;

use Illuminate\Support\Str;

class AIResponseValidator
{
    /**
     * Validate AI response text for safety, length, and secret leak prevention.
     */
    public function validate(string $response): string
    {
        $clean = trim($response);

        if (empty($clean)) {
            return "AI service returned an empty response. Please rephrase your question.";
        }

        // Secret leakage check (tokens, keys, env vars)
        $sensitiveTerms = [
            config('services.ai.gemini.api_key'),
            config('services.ai.openai.api_key'),
            config('services.analytics.token'),
            'secret-analytics-internal-token',
            'AIzaSy',
            'sk-proj-',
        ];

        foreach ($sensitiveTerms as $secret) {
            if (!empty($secret) && is_string($secret) && strlen($secret) > 4) {
                if (Str::contains($clean, $secret)) {
                    $clean = Str::replace($secret, '[REDACTED_SECRET]', $clean);
                }
            }
        }

        return $clean;
    }
}
