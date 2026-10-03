<?php

namespace App\Services\AI;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\AiInsight;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected AIIntentClassifier $classifier;
    protected AIContextBuilder $contextBuilder;
    protected AIPromptBuilder $promptBuilder;
    protected AIResponseValidator $validator;

    public function __construct(
        AIIntentClassifier $classifier,
        AIContextBuilder $contextBuilder,
        AIPromptBuilder $promptBuilder,
        AIResponseValidator $validator
    ) {
        $this->classifier = $classifier;
        $this->contextBuilder = $contextBuilder;
        $this->promptBuilder = $promptBuilder;
        $this->validator = $validator;
    }

    /**
     * Process user message, resolve intent, build context, execute AI provider, and record message history.
     */
    public function processChatMessage(int $userId, string $message, ?int $conversationId = null): array
    {
        // 1. Get or create conversation for authenticated user
        if ($conversationId) {
            $conversation = AiConversation::where('user_id', $userId)->where('id', $conversationId)->first();
            if (!$conversation) {
                throw new \Exception("Conversation not found or access unauthorized.");
            }
        } else {
            $title = strlen($message) > 40 ? substr($message, 0, 40) . '...' : $message;
            $conversation = AiConversation::create([
                'user_id' => $userId,
                'title' => $title,
            ]);
        }

        // 2. Classify intent
        $intent = $this->classifier->classify($message);

        // 3. Build verified financial context
        $contextResult = $this->contextBuilder->buildContext($userId, $intent, $message);
        $contextData = $contextResult['context_data'];
        $sources = $contextResult['sources'];
        $period = $contextResult['period'];

        // 4. Record user message in DB
        $userMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $message,
            'intent' => $intent,
            'sources' => $sources,
            'metadata' => ['period' => $period],
        ]);

        // 5. Build system prompt & fetch conversation history for context window
        $systemPrompt = $this->promptBuilder->buildSystemPrompt($contextData);
        $history = $conversation->messages()
            ->where('id', '<', $userMsg->id)
            ->orderBy('id', 'desc')
            ->take(6)
            ->get()
            ->reverse()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->toArray();

        // 6. Execute AI Provider via AIFactory
        $provider = AIFactory::create();
        try {
            $rawResponse = $provider->generateResponse($systemPrompt, $message, $history);
        } catch (\Throwable $e) {
            Log::error("AIService provider execution error: " . $e->getMessage());
            $rawResponse = "I apologize, but the AI service is currently unavailable. " . $e->getMessage();
        }

        // 7. Validate and sanitize response
        $validatedResponse = $this->validator->validate($rawResponse);

        // 8. Record assistant message in DB
        $assistantMsg = AiMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $validatedResponse,
            'intent' => $intent,
            'sources' => $sources,
            'metadata' => [
                'provider' => $provider->getProviderName(),
                'period' => $period,
            ],
        ]);

        // Audit log entry
        AuditLogService::log('ai_chat_query', $userId, 'AiConversation', $conversation->id, [
            'intent' => $intent,
            'provider' => $provider->getProviderName(),
        ]);

        return [
            'conversation_id' => $conversation->id,
            'conversation_title' => $conversation->title,
            'message' => $validatedResponse,
            'intent' => $intent,
            'sources' => $sources,
            'context_period' => $period,
            'provider' => $provider->getProviderName(),
            'user_message' => [
                'id' => $userMsg->id,
                'role' => 'user',
                'content' => $userMsg->content,
                'created_at' => $userMsg->created_at->toIso8601String(),
            ],
            'assistant_message' => [
                'id' => $assistantMsg->id,
                'role' => 'assistant',
                'content' => $assistantMsg->content,
                'created_at' => $assistantMsg->created_at->toIso8601String(),
            ],
        ];
    }

    /**
     * Generate an on-demand verified AI insight summary for the authenticated user.
     */
    public function generateOnDemandInsight(int $userId, string $insightType = 'monthly_summary'): array
    {
        $contextResult = $this->contextBuilder->buildContext($userId, 'summary', 'Generate monthly financial summary');
        $systemPrompt = $this->promptBuilder->buildSystemPrompt($contextResult['context_data']);
        $userPrompt = "Provide a concise executive summary of my financial performance this period, highlighting key metrics, spending trends, and actionable insights.";

        $provider = AIFactory::create();
        $rawResponse = $provider->generateResponse($systemPrompt, $userPrompt);
        $validatedResponse = $this->validator->validate($rawResponse);

        $insight = AiInsight::create([
            'user_id' => $userId,
            'insight_type' => $insightType,
            'title' => 'AI Executive Financial Summary (' . ucfirst(str_replace('_', ' ', $insightType)) . ')',
            'content' => $validatedResponse,
            'metadata' => [
                'provider' => $provider->getProviderName(),
                'period' => $contextResult['period'],
                'sources' => $contextResult['sources'],
            ],
        ]);

        return [
            'id' => $insight->id,
            'insight_type' => $insight->insight_type,
            'title' => $insight->title,
            'content' => $insight->content,
            'metadata' => $insight->metadata,
            'created_at' => $insight->created_at->toIso8601String(),
        ];
    }
}
