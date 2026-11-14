<?php

require __DIR__.'/../vendor/autoload.php';

// PHPUnit força getenv/$_ENV, mas Laravel também lê $_SERVER. No Docker,
// variáveis exportadas podem continuar em $_SERVER e vencer o XML de testes.
$configuration = simplexml_load_file(__DIR__.'/../phpunit.xml', 'SimpleXMLElement', LIBXML_NONET);
foreach ($configuration->php->env as $variable) {
    if ((string) $variable['force'] === 'true') {
        $name = (string) $variable['name'];
        $value = (string) $variable['value'];
        putenv($name.'='.$value);
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}
