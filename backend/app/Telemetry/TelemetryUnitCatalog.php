<?php

namespace App\Telemetry;

class TelemetryUnitCatalog
{
    /**
     * Definições de telemetria, sem valores ou dependência de banco de dados.
     */
    public function all(): array
    {
        return [
            [
                'key' => 'latitude',
                'name' => 'Latitude',
                'unit' => 'Grau',
                'symbol' => '°',
                'type' => 'number',
                'description' => 'Latitude do satélite.',
            ],
            [
                'key' => 'longitude',
                'name' => 'Longitude',
                'unit' => 'Grau',
                'symbol' => '°',
                'type' => 'number',
                'description' => 'Longitude do satélite.',
            ],
            [
                'key' => 'altitude',
                'name' => 'Altitude',
                'unit' => 'Quilômetro',
                'symbol' => 'km',
                'type' => 'number',
                'description' => 'Altitude do satélite.',
            ],
            [
                'key' => 'velocity',
                'name' => 'Velocidade orbital',
                'unit' => 'Quilômetro por segundo',
                'symbol' => 'km/s',
                'type' => 'number',
                'description' => 'Velocidade orbital do satélite.',
            ],
            [
                'key' => 'temperature',
                'name' => 'Temperatura interna',
                'unit' => 'Celsius',
                'symbol' => '°C',
                'type' => 'number',
                'description' => 'Temperatura interna do satélite.',
            ],
            [
                'key' => 'power_consumption',
                'name' => 'Consumo energético',
                'unit' => 'Watt',
                'symbol' => 'W',
                'type' => 'number',
                'description' => 'Potência elétrica consumida pelo satélite.',
            ],
            [
                'key' => 'battery',
                'name' => 'Nível da bateria',
                'unit' => 'Porcentagem',
                'symbol' => '%',
                'type' => 'number',
                'description' => 'Carga atual da bateria.',
            ],
            [
                'key' => 'pitch',
                'name' => 'Pitch',
                'unit' => 'Grau',
                'symbol' => '°',
                'type' => 'number',
                'description' => 'Ângulo de arfagem do satélite.',
            ],
            [
                'key' => 'roll',
                'name' => 'Roll',
                'unit' => 'Grau',
                'symbol' => '°',
                'type' => 'number',
                'description' => 'Ângulo de rolagem do satélite.',
            ],
            [
                'key' => 'yaw',
                'name' => 'Yaw',
                'unit' => 'Grau',
                'symbol' => '°',
                'type' => 'number',
                'description' => 'Ângulo de guinada do satélite.',
            ],
            [
                'key' => 'signal',
                'name' => 'Qualidade do sinal simulada',
                'unit' => 'Porcentagem',
                'symbol' => '%',
                'type' => 'number',
                'description' => 'Qualidade do sinal de comunicação simulado.',
            ],
            [
                'key' => 'data_rate',
                'name' => 'Taxa de transmissão',
                'unit' => 'Megabit por segundo',
                'symbol' => 'Mbps',
                'type' => 'number',
                'description' => 'Taxa de transmissão de dados.',
            ],
            [
                'key' => 'snr',
                'name' => 'Relação sinal-ruído',
                'unit' => 'Decibel',
                'symbol' => 'dB',
                'type' => 'number',
                'description' => 'Relação entre a potência do sinal e a do ruído.',
            ],
            [
                'key' => 'latency',
                'name' => 'Latência',
                'unit' => 'Milissegundo',
                'symbol' => 'ms',
                'type' => 'number',
                'description' => 'Tempo de latência da comunicação.',
            ],
            [
                'key' => 'communication_status',
                'name' => 'Estado de comunicação',
                'unit' => null,
                'symbol' => null,
                'type' => 'categorical',
                'description' => 'Estado categórico da comunicação: conectado ou desconectado.',
            ],
        ];
    }
}
