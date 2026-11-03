<?php
require __DIR__ . '/ar/src/Exception.php';
require __DIR__ . '/ar/src/PHPMailer.php';
require __DIR__ . '/ar/src/SMTP.php';
require_once __DIR__ . '/countryLookup.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit;
}

$postFields = ['name', 'Email', 'Company', 'Budget', 'field', 'dummy', 'Country', 'CountryName', 'Phone', 'Needs'];
foreach ($postFields as $postField) {
    if (isset($_POST[$postField]) && !is_string($_POST[$postField])) {
        http_response_code(422);
        exit;
    }
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['Email'] ?? '');
$company = trim($_POST['Company'] ?? '');
$message = trim($_POST['field'] ?? '');
$budget = trim($_POST['Budget'] ?? '');
$honeypot = trim($_POST['dummy'] ?? '');
$phone = trim($_POST['Phone'] ?? '');
$needs = trim($_POST['Needs'] ?? '');

if ($honeypot !== '') {
    http_response_code(204);
    exit;
}

$stringLength = static function (string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
};

$allowedBudgets = ['Less than $2,800', '$2,800 to $5,600', 'More than $5,600'];

if (
    $name === ''
    || $stringLength($name) > 256
    || $email === ''
    || $stringLength($email) > 256
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || $stringLength($company) > 256
    || $stringLength($phone) > 40
    || $stringLength($needs) > 256
    || !in_array($budget, $allowedBudgets, true)
    || $stringLength($message) > 5000
) {
    http_response_code(422);
    exit;
}

$escape = static function (string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$safeName = $escape($name);
$safeEmail = $escape($email);
$safeCompany = $escape($company);
$safeMessage = nl2br($escape($message));
$safeBudget = $escape($budget);
$safePhone = $escape($phone);
$safeNeeds = $escape($needs);

$countryCode = osloopResolveCountryCode($_SERVER);
if ($countryCode === '') {
    $countryCode = osloopNormalizeCountryCode($_COOKIE['osloop_country'] ?? '');
}
if ($countryCode === '') {
    $countryCode = osloopNormalizeCountryCode($_POST['Country'] ?? '');
}
$countryName = osloopNormalizeCountryName($_POST['CountryName'] ?? '');
if ($countryName === '') {
    $countryName = osloopCountryNameFromCode($countryCode);
}

$countryRow = '';
$countryAltText = '';
if ($countryCode !== '') {
    $safeCountryName = $escape($countryName);
    $countryRow = "
        <tr>
          <th>Country</th>
          <td>$safeCountryName</td>
        </tr>";
    $countryAltText = " - Country: $countryName";
}

$mail = new PHPMailer(true);

$mailBody = "
<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"UTF-8\">
    <title>New Osloop Form Request</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        background-color: #f7f7f7;
      }
      h1 {
        font-size: 24px;
        font-weight: normal;
        margin: 0 0 20px;
        color: #555;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      table th {
        width: 25%;
        text-align: left;
        font-weight: bold;
        padding: 10px;
        background-color: #eee;
        border: 1px solid #ddd;
      }
      table td {
        width: 75%;
        padding: 10px;
        border: 1px solid #ddd;
      }
      p {
        margin: 0 0 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border: 1px solid #ddd;
      }
    </style>
  </head>
  <body>
    <div class=\"container\">
      <h1>New Osloop Form Submission</h1>
      <p>Hi,</p>
      <p>This is a new Osloop form request with the following data:</p>
      <table>
        <tr>
          <th>Name</th>
          <td>$safeName</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>$safeEmail</td>
        </tr>
        <tr>
          <th>Company</th>
          <td>$safeCompany</td>
        </tr>
        <tr>
          <th>Budget</th>
          <td>$safeBudget</td>
        </tr>
        <tr><th>Phone</th><td>$safePhone</td></tr>
        <tr><th>Services</th><td>$safeNeeds</td></tr>
        $countryRow
        <tr>
          <th>Message</th>
          <td>$safeMessage</td>
        </tr>
      </table>
      <br>
      <p>Thanks <br> agency.osloop.com</p>
    </div>
  </body>
</html>
";

try {
    $mail->SMTPDebug = 0;
    $mail->isSMTP();
    $mail->SMTPAuth = false;
    $mail->Port = 465;
    $mail->SMTPSecure = 'ssl';
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );


    //Recipients
    $mail->setFrom("admin@agency.osloop.com", $name);

    $mail->addAddress('admin@agency.osloop.com', 'Osloop Media Production');
    // $mail->addAddress('abdel.elsaadi@agency.osloop.com', 'Osloop Media Production');

    $mail->isHTML(true);
    $mail->Subject = "Osloop Media - Get a Quote Submission from $name";
    $mail->Body    = $mailBody;
    $mail->AltBody = "This is a new Osloop form request from $name ($email) - Company: $company - Phone: $phone - Services: $needs - Budget: $budget - Message: $message$countryAltText";

    if ($mail->send()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(200);
        echo json_encode(['ok' => true]);
    } else {
        http_response_code(500);
    }

} catch (Exception $e) {
    error_log($e);
    error_log($mail->ErrorInfo);
    http_response_code(500);
}
