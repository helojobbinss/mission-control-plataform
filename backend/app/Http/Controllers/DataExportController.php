<?php

namespace App\Http\Controllers;

use App\Services\DataExportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DataExportController extends Controller
{
    public function __invoke(Request $request, DataExportService $export)
    {
        // Leitura segue as permissões dos endpoints de missões e satélites:
        // qualquer usuário autenticado. Não cria um novo papel no sistema.
        $filters = $request->validate([
            'dataset' => ['required', Rule::in(['missions', 'satellites', 'telemetry'])],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'satellite_id' => ['nullable', 'integer', 'min:1', 'exists:satellites,id'],
            'mission_id' => [Rule::prohibitedIf($request->input('dataset') === 'telemetry'), 'nullable', 'integer', 'min:1', 'exists:missions,id'],
        ]);

        $query = $export->query($filters);
        if (!(clone $query)->exists()) {
            return response()->json(['message' => 'Nenhum registro encontrado para os filtros informados.'], 404);
        }

        return response()->streamDownload(function () use ($export, $query, $filters) {
            $export->write($query, $filters['dataset'], fopen('php://output', 'w'));
        }, 'export-'.$filters['dataset'].'-'.now('UTC')->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
