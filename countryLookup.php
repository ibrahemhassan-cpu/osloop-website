<?php

function osloopNormalizeCountryCode($value): string
{
    if (!is_string($value)) {
        return '';
    }

    $countryCode = strtoupper(trim($value));

    return preg_match('/^[A-Z]{2}$/', $countryCode) && $countryCode !== 'XX'
        ? $countryCode
        : '';
}

function osloopNormalizeCountryName($value): string
{
    if (!is_string($value)) {
        return '';
    }

    $countryName = trim($value);
    $length = function_exists('mb_strlen')
        ? mb_strlen($countryName, 'UTF-8')
        : strlen($countryName);

    if ($countryName === '' || $length > 100 || preg_match('/[\x00-\x1F\x7F]/u', $countryName)) {
        return '';
    }

    return $countryName;
}

function osloopCountryNameFromCode($countryCode): string
{
    $countryCode = osloopNormalizeCountryCode($countryCode);
    if ($countryCode === '') {
        return '';
    }

    if (class_exists('Locale')) {
        $countryName = Locale::getDisplayRegion('und-' . $countryCode, 'en');
        $countryName = osloopNormalizeCountryName($countryName);
        if ($countryName !== '' && strtoupper($countryName) !== $countryCode) {
            return $countryName;
        }
    }

    return $countryCode;
}

function osloopResolveCountryCode(array $server, $prefetchedCountry = ''): string
{
    $countryCandidates = [
        $server['HTTP_CF_IPCOUNTRY'] ?? '',
        $server['HTTP_CLOUDFRONT_VIEWER_COUNTRY'] ?? '',
        $server['HTTP_X_VERCEL_IP_COUNTRY'] ?? '',
        $server['HTTP_X_APPENGINE_COUNTRY'] ?? '',
        $server['GEOIP_COUNTRY_CODE'] ?? '',
    ];

    foreach ($countryCandidates as $countryCandidate) {
        $countryCode = osloopNormalizeCountryCode($countryCandidate);
        if ($countryCode !== '') {
            return $countryCode;
        }
    }

    return osloopNormalizeCountryCode($prefetchedCountry);
}

function osloopLookupCountryCodeByIp($ip): string
{
    if (
        !is_string($ip)
        || !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)
        || !function_exists('curl_init')
    ) {
        return '';
    }

    $request = curl_init('https://api.country.is/' . rawurlencode($ip));
    if ($request === false) {
        return '';
    }

    curl_setopt_array($request, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT_MS => 400,
        CURLOPT_TIMEOUT_MS => 1500,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_MAXFILESIZE => 4096,
    ]);

    $response = curl_exec($request);
    $status = curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    curl_close($request);

    if (!is_string($response) || $status !== 200 || strlen($response) > 4096) {
        return '';
    }

    $data = json_decode($response, true);

    return is_array($data) ? osloopNormalizeCountryCode($data['country'] ?? '') : '';
}
