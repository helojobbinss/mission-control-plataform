<?php

namespace App\Exceptions;

use RuntimeException;

class SatelliteDataException extends RuntimeException
{
    protected int $httpStatus;

    public function __construct(string $message, int $httpStatus = 502)
    {
        parent::__construct($message);

        $this->httpStatus = $httpStatus;
    }

    public function httpStatus(): int
    {
        return $this->httpStatus;
    }
}
