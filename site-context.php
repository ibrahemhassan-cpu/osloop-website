<?php

require_once __DIR__ . '/countryLookup.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

$countryCode = osloopResolveCountryCode($_SERVER);
if ($countryCode === '') {
    $countryCode = osloopLookupCountryCodeByIp($_SERVER['REMOTE_ADDR'] ?? '');
}

if ($countryCode !== '') {
    setcookie('osloop_country', $countryCode, [
        'expires' => time() + 1800,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

echo json_encode(['country' => $countryCode]);
