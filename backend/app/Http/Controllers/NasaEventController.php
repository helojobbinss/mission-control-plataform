<?php

namespace App\Http\Controllers;

use App\Services\Integrations\NasaDonkiService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Throwable;

class NasaEventController extends Controller
{
    public function query(
        Request $request,
        NasaDonkiService $nasa,
        string $method,
        string $eventType,
        string $errorMessage
    ) {
        $dates = $request->validate([
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $start = $dates['start_date'] ?? Carbon::now('UTC')->subDays(7)->toDateString();
        $end = $dates['end_date'] ?? Carbon::now('UTC')->toDateString();

        if ($end < $start) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'end_date' => ['A data final deve ser igual ou posterior à inicial.'],
            ]);
        }

        try {
            return response()->json([
                'success' => true,
                'source' => 'NASA DONKI',
                'event_type' => $eventType,
                'data' => $nasa->{$method}($start, $end),
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
            ], 502);
        }
    }
}
