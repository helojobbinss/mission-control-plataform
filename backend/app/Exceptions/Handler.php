<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Database\QueryException;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    protected function shouldReturnJson($request, Throwable $e)
    {
        return $request->is('api/*') || parent::shouldReturnJson($request, $e);
    }

    public function register()
    {
        $this->renderable(function (QueryException $exception, $request) {
            $code = (int) ($exception->errorInfo[1] ?? 0);
            if ($request->is('api/*') && (
                in_array($code, [1451, 787], true)
                || str_contains($exception->getMessage(), 'FOREIGN KEY constraint failed')
            )) {
                return response()->json([
                    'message' => 'Este registro possui vínculos e não pode ser excluído.',
                ], 409);
            }
        });

        $this->reportable(function (Throwable $e) {
            //
        });
    }
}
