<?php
require __DIR__ . '/src/Exception.php';
require __DIR__ . '/src/PHPMailer.php';
require __DIR__ . '/src/SMTP.php';
require_once __DIR__ . '/../countryLookup.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    exit;
}

$postFields = ['name', 'Email', 'WhatsApp', 'phone', 'Company', 'ProjectBudget', 'Message', 'field', 'Budget', 'dummy', 'Country', 'CountryName'];
foreach ($postFields as $postField) {
    if (isset($_POST[$postField]) && !is_string($_POST[$postField])) {
        http_response_code(422);
        exit;
    }
}

$name = trim((string) ($_POST['name'] ?? ""));
$email = trim((string) ($_POST['Email'] ?? ""));
$whatsapp = trim((string) ($_POST['WhatsApp'] ?? $_POST['phone'] ?? ""));
$company = trim((string) ($_POST['Company'] ?? ""));
$projectBudget = trim((string) ($_POST['ProjectBudget'] ?? ""));
$message = trim((string) ($_POST['Message'] ?? ""));
$legacyField = trim((string) ($_POST['field'] ?? ""));
$budget = trim((string) ($_POST['Budget'] ?? ""));
$honeypot = trim((string) ($_POST['dummy'] ?? ""));

if ($honeypot !== '') {
    http_response_code(204);
    exit;
}

$stringLength = static function (string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
};

// Support submissions from an older or cached copy of the Arabic page.
if ($message === '' && $legacyField !== '') {
    if ($whatsapp === '') {
        $whatsapp = $legacyField;
    } else {
        $legacyPrefix = "رقم الواتساب: {$whatsapp}\n\nالرسالة:\n";
        $message = strpos($legacyField, $legacyPrefix) === 0
            ? substr($legacyField, strlen($legacyPrefix))
            : $legacyField;
    }
}

$isPopup = $budget === 'Arabic landing page popup';
$allowedProjectBudgets = ['$1000 - $2800', '$2800 - $5600', 'اكثر من 5600$'];

if (
    $name === ''
    || $stringLength($name) > 120
    || ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || $stringLength($email) > 254))
    || $whatsapp === ''
    || $stringLength($whatsapp) > 30
    || $stringLength($company) > 160
    || $stringLength($projectBudget) > 120
    || ($projectBudget !== '' && !in_array($projectBudget, $allowedProjectBudgets, true))
    || ($isPopup && $message === '')
    || $stringLength($message) > 3000
    || $stringLength($budget) > 200
) {
    http_response_code(422);
    exit;
}

$escape = static function (string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$safeName = $escape($name);
$safeEmail = $email !== '' ? $escape($email) : 'غير مُدخل';
$safeWhatsapp = $escape($whatsapp);
$safeCompany = $escape($company);
$safeProjectBudget = $escape($projectBudget);
$safeMessage = nl2br($escape($message));
$source = $isPopup ? 'النموذج المنبثق' : 'النموذج الرئيسي';
$safeSource = $escape($source);

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
          <th align=\"right\">الدولة</th>
          <td align=\"right\">$safeCountryName</td>
        </tr>";
    $countryAltText = "\nالدولة: $countryName";
}

$messageRow = '';
if ($message !== '') {
    $messageRow = "
        <tr>
          <th align=\"right\">الرسالة</th>
          <td align=\"right\">$safeMessage</td>
        </tr>";
}

$companyRow = '';
if ($company !== '') {
    $companyRow = "
        <tr>
          <th align=\"right\">اسم الشركة</th>
          <td align=\"right\">$safeCompany</td>
        </tr>";
}

$projectBudgetRow = '';
if ($projectBudget !== '') {
    $projectBudgetRow = "
        <tr>
          <th align=\"right\">الميزانية</th>
          <td align=\"right\">$safeProjectBudget</td>
        </tr>";
}

$mail = new PHPMailer(true);

$mailBody = "
<!DOCTYPE html>
<html lang=\"ar\" dir=\"rtl\">
  <head>
    <meta charset=\"UTF-8\">
    <title>طلب جديد من موقع أسلوب</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        background-color: #f7f7f7;
        direction: rtl;
        text-align: right;
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
        direction: rtl;
      }
      table th {
        width: 25%;
        text-align: right;
        font-weight: bold;
        padding: 10px;
        background-color: #eee;
        border: 1px solid #ddd;
      }
      table td {
        width: 75%;
        text-align: right;
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
  <body dir=\"rtl\">
    <div class=\"container\" dir=\"rtl\">
      <h1>طلب جديد من نموذج أسلوب</h1>
      <p>مرحبًا،</p>
      <p>تم استلام طلب جديد بالبيانات التالية:</p>
      <table dir=\"rtl\">
        <tr>
          <th align=\"right\">الاسم</th>
          <td align=\"right\">$safeName</td>
        </tr>
        <tr>
          <th align=\"right\">البريد الإلكتروني</th>
          <td align=\"right\">$safeEmail</td>
        </tr>
        <tr>
          <th align=\"right\">رقم الواتساب</th>
          <td align=\"right\">$safeWhatsapp</td>
        </tr>
        <tr>
          <th align=\"right\">مصدر الطلب</th>
          <td align=\"right\">$safeSource</td>
        </tr>
        $companyRow
        $projectBudgetRow
        $countryRow
        $messageRow
      </table>
      <br>
      <p>شكرًا،<br>agency.osloop.com</p>
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
    $mail->CharSet = 'UTF-8';


    //Recipients
    $mail->setFrom("admin@agency.osloop.com", $name);

    // $mail->addAddress('admin@agency.osloop.com', 'Osloop Media Production');
    $mail->addAddress('abdel.elsaadi@agency.osloop.com', 'Osloop Media Production');

    $mail->isHTML(true);
    $mail->Subject = "طلب جديد من نموذج أسلوب - $name";
    $mail->Body    = $mailBody;
    $mail->AltBody = "طلب جديد من نموذج أسلوب\nالاسم: $name\nالبريد الإلكتروني: "
        . ($email !== '' ? $email : 'غير مُدخل')
        . "\nرقم الواتساب: $whatsapp\nمصدر الطلب: $source"
        . ($company !== '' ? "\nاسم الشركة: $company" : '')
        . ($projectBudget !== '' ? "\nالميزانية: $projectBudget" : '')
        . $countryAltText
        . ($message !== '' ? "\nالرسالة: $message" : '');

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
