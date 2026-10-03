<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'analytics' => [
        'url' => env('ANALYTICS_SERVICE_URL', 'http://127.0.0.1:8001'),
        'token' => env('ANALYTICS_SERVICE_TOKEN', 'secret-analytics-internal-token-2026'),
    ],

    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),
        'gemini' => [
            'api_key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_MODEL', 'gemini-1.5-flash'),
        ],
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        ],
        'rate_limit' => (int) env('AI_RATE_LIMIT_PER_MINUTE', 15),
        'max_request_length' => (int) env('AI_MAX_REQUEST_LENGTH', 1000),
        'max_response_tokens' => (int) env('AI_MAX_RESPONSE_TOKENS', 800),
    ],

];
