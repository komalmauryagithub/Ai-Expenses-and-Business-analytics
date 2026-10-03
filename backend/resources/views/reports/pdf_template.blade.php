<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'Financial Report' }}</title>
    <style>
        @page {
            margin: 30px 35px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border-b: 2px solid #6366f1;
            padding-bottom: 10px;
        }
        .brand-title {
            font-size: 18px;
            font-weight: bold;
            color: #4f46e5;
            margin: 0;
        }
        .report-title {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            margin: 3px 0 0 0;
        }
        .meta-text {
            font-size: 10px;
            color: #64748b;
            text-align: right;
        }
        .summary-box-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px;
            margin-bottom: 20px;
        }
        .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
        }
        .summary-card .label {
            font-size: 9px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 4px;
        }
        .section-heading {
            font-size: 12px;
            font-weight: bold;
            color: #334155;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 15px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            text-align: left;
            padding: 7px 8px;
            border-bottom: 2px solid #cbd5e1;
            font-size: 9px;
            text-transform: uppercase;
        }
        .data-table td {
            padding: 7px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
        }
        .data-table tr:nth-child(even) {
            background-color: #fafafa;
        }
        .text-right {
            text-align: right;
        }
        .text-green {
            color: #059669;
            font-weight: bold;
        }
        .text-red {
            color: #dc2626;
            font-weight: bold;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: bold;
            background-color: #e0e7ff;
            color: #3730a3;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 8px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td>
                <div class="brand-title">AI Expense & Business Analytics</div>
                <div class="report-title">{{ $title }}</div>
            </td>
            <td class="meta-text">
                <div><strong>User:</strong> {{ $user_name }} ({{ $user_email }})</div>
                <div><strong>Period:</strong> {{ $period_label }}</div>
                <div><strong>Generated:</strong> {{ $generated_at }}</div>
            </td>
        </tr>
    </table>

    <!-- Summary Metrics -->
    @if(!empty($summary))
    <table class="summary-box-table">
        <tr>
            @foreach($summary as $card)
            <td class="summary-card">
                <div class="label">{{ $card['label'] }}</div>
                <div class="value">{{ $card['value'] }}</div>
            </td>
            @endforeach
        </tr>
    </table>
    @endif

    <!-- Breakdown Table (If applicable) -->
    @if(!empty($breakdown) && count($breakdown) > 0)
    <div class="section-heading">Category & Source Breakdown</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Category / Type</th>
                <th class="text-right">Count</th>
                <th class="text-right">Share %</th>
                <th class="text-right">Total Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($breakdown as $item)
            <tr>
                <td><strong>{{ $item['name'] }}</strong></td>
                <td class="text-right">{{ $item['count'] }}</td>
                <td class="text-right">{{ $item['percentage'] }}%</td>
                <td class="text-right">{{ $item['amount_formatted'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Detailed Rows Table -->
    <div class="section-heading">Transaction Records</div>
    @if(empty($rows) || count($rows) === 0)
        <p style="text-align: center; color: #94a3b8; padding: 20px;">No transaction records found matching the selected period and filters.</p>
    @else
    <table class="data-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category / Type</th>
                <th>Method / Source</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
            <tr>
                <td>{{ $row['date'] }}</td>
                <td>{{ $row['description'] }}</td>
                <td><span class="badge">{{ $row['category'] }}</span></td>
                <td>{{ $row['method_or_source'] }}</td>
                <td class="text-right {{ str_contains($row['amount_formatted'], '-') ? 'text-red' : 'text-green' }}">
                    {{ $row['amount_formatted'] }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Footer -->
    <div class="footer">
        Confidential &bull; Generated by AI Expense & Business Analytics SaaS &bull; All calculations derived from verified PostgreSQL database records.
    </div>

</body>
</html>
