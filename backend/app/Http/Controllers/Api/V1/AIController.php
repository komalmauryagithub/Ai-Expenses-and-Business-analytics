<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AiConversation;
use App\Models\AiInsight;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIController extends Controller
{
    protected AIService $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Send message to AI Financial Assistant.
     * POST /api/v1/ai/chat
     */
    public function chat(Request $request): JsonResponse
    {
        @set_time_limit(120);
        $maxLength = (int) config('services.ai.max_request_length', 1000);
        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string', 'min:2', "max:{$maxLength}"],
            'conversation_id' => ['nullable', 'integer', 'exists:ai_conversations,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for AI chat message.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $userId = $request->user()->id;
            $result = $this->aiService->processChatMessage(
                $userId,
                $request->input('message'),
                $request->input('conversation_id')
            );

            return response()->json([
                'success' => true,
                'message' => 'AI assistant response generated successfully',
                'data' => $result,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 500);
        }
    }

    /**
     * List user AI conversations.
     * GET /api/v1/ai/conversations
     */
    public function indexConversations(Request $request): JsonResponse
    {
        $conversations = AiConversation::where('user_id', $request->user()->id)
            ->withCount('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'AI conversations retrieved successfully',
            'data' => $conversations,
        ], 200);
    }

    /**
     * Create a new AI conversation.
     * POST /api/v1/ai/conversations
     */
    public function createConversation(Request $request): JsonResponse
    {
        $title = $request->input('title', 'New Conversation');
        $conversation = AiConversation::create([
            'user_id' => $request->user()->id,
            'title' => $title,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'New AI conversation created successfully',
            'data' => $conversation,
        ], 201);
    }

    /**
     * Show single AI conversation with messages.
     * GET /api/v1/ai/conversations/{id}
     */
    public function showConversation(Request $request, int $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->with('messages')
            ->first();

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found or access unauthorized.',
                'errors' => new \stdClass(),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'AI conversation retrieved successfully',
            'data' => $conversation,
        ], 200);
    }

    /**
     * Delete an AI conversation.
     * DELETE /api/v1/ai/conversations/{id}
     */
    public function destroyConversation(Request $request, int $id): JsonResponse
    {
        $conversation = AiConversation::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$conversation) {
            return response()->json([
                'success' => false,
                'message' => 'Conversation not found or access unauthorized.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'AI conversation deleted successfully',
            'data' => null,
        ], 200);
    }

    /**
     * List user stored AI insights.
     * GET /api/v1/ai/insights
     */
    public function indexInsights(Request $request): JsonResponse
    {
        $insights = AiInsight::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'AI insights retrieved successfully',
            'data' => $insights,
        ], 200);
    }

    /**
     * Generate on-demand AI insight summary.
     * POST /api/v1/ai/insights/generate
     */
    public function generateInsight(Request $request): JsonResponse
    {
        $type = $request->input('insight_type', 'monthly_summary');
        try {
            $insight = $this->aiService->generateOnDemandInsight($request->user()->id, $type);

            return response()->json([
                'success' => true,
                'message' => 'AI insight generated successfully',
                'data' => $insight,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 500);
        }
    }
}
