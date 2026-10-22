<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class PasswordController extends Controller
{
    /**
     * Gera um token de recuperação sem enviar e-mail.
     * Uso temporário para desenvolvimento.
     */
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Usuário não encontrado.',
            ], 404);
        }

        $token = Str::random(64);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => Carbon::now(),
            ]
        );

        return response()->json([
            'message' => 'Token de recuperação gerado com sucesso.',
            'token' => $token,
            'expires_in_minutes' => 60,
        ]);
    }

    /**
     * Redefine a senha utilizando o token gerado.
     */
    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_resets')
            ->where('email', $data['email'])
            ->first();

        if (
            !$record ||
            Carbon::parse($record->created_at)->addMinutes(60)->isPast() ||
            !Hash::check($data['token'], $record->token)
        ) {
            return response()->json([
                'message' => 'Token inválido ou expirado.',
            ], 422);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Usuário não encontrado.',
            ], 404);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'remember_token' => Str::random(60),
        ])->save();

        DB::table('password_resets')
            ->where('email', $data['email'])
            ->delete();

        return response()->json([
            'message' => 'Senha redefinida com sucesso.',
        ]);
    }
}
