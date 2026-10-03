<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log a security or user action into the audit_logs table.
     */
    public static function log(string $action, ?int $userId = null, ?string $entityType = null, ?int $entityId = null, ?array $metadata = null): void
    {
        try {
            AuditLog::create([
                'user_id' => $userId ?? auth()->id(),
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'metadata' => $metadata,
                'ip_address' => Request::ip(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Silently absorb log failures to ensure primary business operation completes safely
            logger()->error('Failed to write audit log: ' . $e->getMessage());
        }
    }
}
