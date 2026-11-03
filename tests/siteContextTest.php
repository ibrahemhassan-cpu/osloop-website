<?php

require_once __DIR__ . '/../countryLookup.php';

$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_CF_IPCOUNTRY'] = 'eg';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';

ob_start();
include __DIR__ . '/../site-context.php';
$metadataResponse = ob_get_clean();
if ($metadataResponse !== '{"country":"EG"}') {
    throw new RuntimeException('The endpoint should return country metadata');
}

unset($_SERVER['HTTP_CF_IPCOUNTRY']);

ob_start();
include __DIR__ . '/../site-context.php';
$emptyResponse = ob_get_clean();
if ($emptyResponse !== '{"country":""}') {
    throw new RuntimeException('An unavailable lookup should remain optional');
}

echo "siteContextTest: PASS\n";
