"""Exercise both PHP handlers with a mail transport stub. No email is sent."""
import base64
import json
from pathlib import Path
import subprocess
import tempfile


REPO = Path(__file__).resolve().parents[1]
SANDBOX = Path(tempfile.mkdtemp(prefix="osloop-form-tests-"))
assert SANDBOX.resolve().parent == Path(tempfile.gettempdir()).resolve()


def request(handler, payload, expected, method="POST"):
    source = REPO / handler
    fixture = SANDBOX / "handler.php"
    capture = SANDBOX / "mail.json"
    if capture.exists():
        capture.unlink()
    php = source.read_text(encoding="utf-8")
    php = php.replace("__DIR__", "'" + source.parent.as_posix().replace("'", "\\'") + "'")
    stub = '''$mail = new class(true) extends PHPMailer {
        public function send() {
            file_put_contents(getenv('OSLOOP_TEST_CAPTURE'), json_encode([
                'html' => $this->Body, 'text' => $this->AltBody,
                'recipients' => $this->getToAddresses()
            ]));
            return true;
        }
    };'''
    assert "$mail = new PHPMailer(true);" in php
    fixture.write_text(php.replace("$mail = new PHPMailer(true);", stub), encoding="utf-8")
    encoded = base64.b64encode(json.dumps(payload).encode()).decode()
    command = f'''
    putenv('OSLOOP_TEST_CAPTURE={capture.as_posix()}');
    $_SERVER = ['REQUEST_METHOD' => '{method}', 'HTTP_CF_IPCOUNTRY' => 'EG'];
    $_POST = json_decode(base64_decode('{encoded}'), true);
    register_shutdown_function(function () {{ echo "\\nSTATUS:" . http_response_code(); }});
    include '{fixture.as_posix()}';
    '''
    result = subprocess.run(["php", "-r", command], capture_output=True, text=True, check=True)
    body, status = result.stdout.rsplit("\nSTATUS:", 1)
    assert int(status) == expected, (handler, expected, status, result.stderr)
    if expected != 200:
        assert not capture.exists(), "Invalid or honeypot requests must not reach mail delivery"
        return None
    assert json.loads(body) == {"ok": True}, body
    mail = json.loads(capture.read_text(encoding="utf-8"))
    assert mail["recipients"], "Original recipient configuration must be retained"
    return mail


english = {
    "name": "Test <Name>", "Email": "test@example.invalid", "Company": "<Company>",
    "Phone": "+201000000001", "Needs": "<Explainer>", "Budget": "Less than $2,800",
    "field": "A test message with <script>escaped content</script>",
}
arabic = {
    "name": "Test <Name>", "WhatsApp": "+201000000001", "Budget": "Arabic landing page",
    "Company": "<Company>", "ProjectBudget": "$1000 - $2800", "field": "Test message",
}
for handler, payload in [("formAction.php", english), ("ar/formAction.php", arabic)]:
    request(handler, {}, 405, "GET")
    request(handler, {}, 422)
    request(handler, {**payload, "name": ["unexpected array"]}, 422)
    request(handler, {**payload, "Email": "invalid email"}, 422)
    request(handler, {**payload, "dummy": "bot"}, 204)
    mail = request(handler, payload, 200)
    assert "&lt;Name&gt;" in mail["html"] and "<Name>" not in mail["html"]
    assert "&lt;Company&gt;" in mail["html"]
    if handler == "formAction.php":
        assert "+201000000001" in mail["text"] and "&lt;Explainer&gt;" in mail["html"]
        assert "<script>" not in mail["html"]
        request(handler, {**payload, "Budget": "arbitrary"}, 422)
        request(handler, {**payload, "Phone": ["array"]}, 422)
        for budget in ["$2,800 to $5,600", "More than $5,600"]:
            request(handler, {**payload, "Budget": budget}, 200)
    else:
        request(handler, {**payload, "ProjectBudget": "arbitrary"}, 422)
    print(f"PASS {handler}: validation, honeypot, accepted budgets, escaping and success response")
