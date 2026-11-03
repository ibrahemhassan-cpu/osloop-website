<?php

require_once __DIR__ . '/../countryLookup.php';

function assertCountryLookupSame(string $expected, string $actual, string $message): void
{
    if ($actual !== $expected) {
        throw new RuntimeException(
            $message . ': expected ' . var_export($expected, true) . ', got ' . var_export($actual, true)
        );
    }
}

$headerResult = osloopResolveCountryCode(
    ['HTTP_CF_IPCOUNTRY' => 'eg', 'REMOTE_ADDR' => '8.8.8.8'],
    'US'
);
assertCountryLookupSame('EG', $headerResult, 'A valid metadata country should remain the fast path');

$prefetchedResult = osloopResolveCountryCode([], 'us');
assertCountryLookupSame('US', $prefetchedResult, 'A valid prefetched country should be accepted');

$missingResult = osloopResolveCountryCode([], '');
assertCountryLookupSame('', $missingResult, 'Missing country data should remain optional');

assertCountryLookupSame('', osloopNormalizeCountryCode('XX'), 'Unknown country codes should be rejected');
assertCountryLookupSame('', osloopNormalizeCountryCode('USA'), 'Non-ISO alpha-2 values should be rejected');
assertCountryLookupSame('', osloopNormalizeCountryCode(['US']), 'Non-string values should be rejected');
assertCountryLookupSame('Egypt', osloopNormalizeCountryName(' Egypt '), 'A country name should be trimmed');
assertCountryLookupSame('', osloopNormalizeCountryName("Egypt\nInjected"), 'Control characters should be rejected');

assertCountryLookupSame('', osloopLookupCountryCodeByIp('127.0.0.1'), 'Loopback addresses should not trigger an external lookup');
assertCountryLookupSame('', osloopLookupCountryCodeByIp('192.168.1.1'), 'Private addresses should not trigger an external lookup');
assertCountryLookupSame('', osloopLookupCountryCodeByIp('not-an-ip'), 'Invalid addresses should not trigger an external lookup');

echo "countryLookupTest: PASS\n";
