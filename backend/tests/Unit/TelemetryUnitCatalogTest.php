<?php

namespace Tests\Unit;

use App\Telemetry\TelemetryUnitCatalog;
use PHPUnit\Framework\TestCase;

class TelemetryUnitCatalogTest extends TestCase
{
    public function test_catalog_contains_exactly_the_expected_unique_identifiers(): void
    {
        $keys = array_column((new TelemetryUnitCatalog())->all(), 'key');

        $this->assertCount(15, $keys);
        $this->assertSameSize($keys, array_unique($keys));
        $this->assertEqualsCanonicalizing([
            'latitude', 'longitude', 'altitude', 'velocity', 'temperature',
            'power_consumption', 'battery', 'pitch', 'roll', 'yaw',
            'signal', 'data_rate', 'snr', 'latency', 'communication_status',
        ], $keys);
    }

    /**
     * @dataProvider expectedUnits
     */
    public function test_units_symbols_and_types_are_correct($key, $unit, $symbol, $type): void
    {
        $definitions = array_column((new TelemetryUnitCatalog())->all(), null, 'key');

        $this->assertArrayHasKey($key, $definitions);
        $this->assertSame($unit, $definitions[$key]['unit']);
        $this->assertSame($symbol, $definitions[$key]['symbol']);
        $this->assertSame($type, $definitions[$key]['type']);
    }

    public function expectedUnits(): array
    {
        return [
            'latitude' => ['latitude', 'Grau', '°', 'number'],
            'longitude' => ['longitude', 'Grau', '°', 'number'],
            'altitude' => ['altitude', 'Quilômetro', 'km', 'number'],
            'velocity' => ['velocity', 'Quilômetro por segundo', 'km/s', 'number'],
            'temperature' => ['temperature', 'Celsius', '°C', 'number'],
            'power_consumption' => ['power_consumption', 'Watt', 'W', 'number'],
            'battery' => ['battery', 'Porcentagem', '%', 'number'],
            'pitch' => ['pitch', 'Grau', '°', 'number'],
            'roll' => ['roll', 'Grau', '°', 'number'],
            'yaw' => ['yaw', 'Grau', '°', 'number'],
            'signal' => ['signal', 'Porcentagem', '%', 'number'],
            'data_rate' => ['data_rate', 'Megabit por segundo', 'Mbps', 'number'],
            'snr' => ['snr', 'Decibel', 'dB', 'number'],
            'latency' => ['latency', 'Milissegundo', 'ms', 'number'],
            'communication_status' => ['communication_status', null, null, 'categorical'],
        ];
    }

    public function test_every_definition_has_only_the_required_metadata(): void
    {
        foreach ((new TelemetryUnitCatalog())->all() as $definition) {
            $this->assertEqualsCanonicalizing(
                ['key', 'name', 'unit', 'symbol', 'type', 'description'],
                array_keys($definition)
            );
            $this->assertIsString($definition['name']);
            $this->assertNotSame('', trim($definition['name']));
            $this->assertIsString($definition['description']);
            $this->assertNotSame('', trim($definition['description']));
        }
    }

    public function test_communication_status_describes_the_two_categories_without_a_unit(): void
    {
        $definitions = array_column((new TelemetryUnitCatalog())->all(), null, 'key');
        $status = $definitions['communication_status'];

        $this->assertSame('categorical', $status['type']);
        $this->assertNull($status['unit']);
        $this->assertNull($status['symbol']);
        $this->assertStringContainsString('conectado ou desconectado', $status['description']);
    }
}
