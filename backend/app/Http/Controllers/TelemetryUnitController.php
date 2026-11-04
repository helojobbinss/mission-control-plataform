<?php

namespace App\Http\Controllers;

use App\Telemetry\TelemetryUnitCatalog;
use Illuminate\Http\JsonResponse;

class TelemetryUnitController extends Controller
{
    public function index(TelemetryUnitCatalog $catalog): JsonResponse
    {
        return response()->json(['data' => $catalog->all()]);
    }
}
