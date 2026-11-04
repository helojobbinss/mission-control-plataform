<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'nasa' => [
        'donki_base_url' => env(
            'NASA_DONKI_BASE_URL',
            'https://api.nasa.gov/DONKI'
        ),
        'api_key' => env('NASA_API_KEY', 'DEMO_KEY'),
    ],

    'python_api' => [
        'url' => env('PYTHON_API_URL', 'http://127.0.0.1:8001'),
    ],
    'celestrak' => [
        'base_url' => env(
            'CELESTRAK_BASE_URL',
            'https://celestrak.org/NORAD/elements'
        ),
    ],
];
