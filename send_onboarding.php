<?php
// ════════════════════════════════════════════════════════════
// Our 365 Financial Solution — Onboarding Email Handler
// Upload to: public_html/send_onboarding.php (GoDaddy)
// Called by onboarding-index.html via fetch POST
// ════════════════════════════════════════════════════════════

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// ── Helpers ──────────────────────────────────────────────────
function v($d, $k) {
    return isset($d[$k]) && $d[$k] !== '' ? htmlspecialchars($d[$k], ENT_QUOTES) : '—';
}
function row($label, $val, $shade = false) {
    $bg = $shade ? 'background:#F3F7F4;' : 'background:#ffffff;';
    return "<tr style=\"{$bg}\">
      <td style=\"padding:9px 14px;font-weight:700;color:#325838;width:38%;border-bottom:1px solid #E5E7EB;font-size:13px\">{$label}</td>
      <td style=\"padding:9px 14px;color:#1a1a1a;border-bottom:1px solid #E5E7EB;font-size:13px\">{$val}</td>
    </tr>";
}

// ── Build HTML email ─────────────────────────────────────────
$name    = v($data, 'first_name') . ' ' . v($data, 'last_name');
$conf    = v($data, 'confirmation_number');
$email   = isset($data['email']) ? $data['email'] : '';
$submitted = date('F j, Y \a\t g:i A T');

$html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F3F7F4;font-family:Arial,sans-serif">';
$html .= '<div style="max-width:620px;margin:24px auto">';

// Header
$html .= '<div style="background:#325838;padding:24px 28px;border-radius:12px 12px 0 0">';
$html .= '<h2 style="color:#C9A84C;margin:0;font-size:20px">New Agent Application Received</h2>';
$html .= '<p style="color:#A8C5AA;margin:6px 0 0;font-size:13px">Our 365 Financial Solution LLC &mdash; ' . $submitted . '</p>';
$html .= '</div>';

// Action banner
$html .= '<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 18px;font-size:13px;color:#92400E">';
$html .= '<strong>Action Required:</strong> Log in to the admin panel to review and approve this application.<br>';
$html .= '<a href="https://our365fs.github.io/our365-onboarding/admin.html" style="color:#325838;font-weight:700">https://our365fs.github.io/our365-onboarding/admin.html</a>';
$html .= '</div>';

// Body
$html .= '<div style="background:#fff;padding:24px 28px;border:1px solid #E5E7EB;border-top:none">';
$html .= '<table style="width:100%;border-collapse:collapse">';

$html .= '<tr><td colspan="2" style="padding:10px 0 6px;font-size:11px;font-weight:800;color:#325838;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #325838">Personal Information</td></tr>';
$html .= row('Confirmation #', $conf, false);
$html .= row('Full Name',      $name, true);
$html .= row('Email',          v($data,'email'), false);
$html .= row('Phone',          v($data,'phone'), true);
$html .= row('Date of Birth',  v($data,'date_of_birth'), false);
$html .= row('Address',        v($data,'address'), true);

$html .= '<tr><td colspan="2" style="padding:14px 0 6px;font-size:11px;font-weight:800;color:#325838;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #325838">License &amp; Credentials</td></tr>';
$html .= row('License #',       v($data,'license_number') . ' (' . v($data,'license_state') . ')', false);
$html .= row('License Type',    v($data,'license_type'), true);
$html .= row('Expiry',          v($data,'license_expiry'), false);
$html .= row('NPN',             v($data,'npn'), true);
$html .= row('Experience',      v($data,'experience'), false);
$html .= row('Lines of Auth.',  v($data,'lines_of_authority'), true);
$html .= row('States Appointed',v($data,'states_appointed'), false);

$html .= '<tr><td colspan="2" style="padding:14px 0 6px;font-size:11px;font-weight:800;color:#325838;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #325838">Agency &amp; Background</td></tr>';
$html .= row('Referring Agent', v($data,'referring_agent'), false);
$html .= row('E&amp;O Carrier', v($data,'eo_carrier'), true);
$html .= row('E&amp;O Policy #',v($data,'eo_policy_number'), false);
$html .= row('Regulatory',      v($data,'regulatory_action'), true);
if (!empty($data['regulatory_explanation'])) {
    $html .= row('Explanation', v($data,'regulatory_explanation'), false);
}

$html .= '<tr><td colspan="2" style="padding:14px 0 6px;font-size:11px;font-weight:800;color:#325838;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #325838">Banking — Direct Deposit</td></tr>';
$html .= row('Bank Name',       v($data,'bank_name'), false);
$html .= row('Account Type',    v($data,'account_type'), true);
$html .= row('Routing #',       v($data,'routing_number'), false);
$html .= row('Account #',       v($data,'account_number'), true);
$html .= row('Name on Account', v($data,'name_on_account'), false);

$html .= '<tr><td colspan="2" style="padding:14px 0 6px;font-size:11px;font-weight:800;color:#325838;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #325838">Signature</td></tr>';
$html .= row('Typed Name', v($data,'typed_name'), false);
$html .= row('Signed At',  $submitted, true);

$html .= '</table>';
$html .= '</div>';

// Footer
$html .= '<div style="background:#325838;padding:16px 28px;border-radius:0 0 12px 12px;text-align:center">';
$html .= '<p style="color:#A8C5AA;font-size:12px;margin:0">Our 365 Financial Solution LLC &bull; 3500 N State Road 7, Suite 310, Lauderdale Lakes, FL 33319</p>';
$html .= '<p style="margin:4px 0 0"><a href="https://our365financialsolution.net" style="color:#C9A84C;font-size:12px">our365financialsolution.net</a></p>';
$html .= '</div>';

$html .= '</div></body></html>';

// ── Send to agency ───────────────────────────────────────────
$to_agency   = 'onboarding@our365financialsolution.net';
$from        = 'onboarding@our365financialsolution.net';
$subject     = 'New Agent Application: ' . $name . ' [' . $conf . ']';

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: Our 365 Onboarding <" . $from . ">\r\n";
$headers .= "Reply-To: " . $email . "\r\n";

$sent1 = mail($to_agency, $subject, $html, $headers);

// ── Log result ───────────────────────────────────────────────
$log_entry = date('Y-m-d H:i:s') . ' | ' . $name . ' | ' . $email . ' | ' . $conf . ' | sent=' . ($sent1 ? '1' : '0') . "\n";
file_put_contents(__DIR__ . '/onboarding_log.txt', $log_entry, FILE_APPEND | LOCK_EX);

echo json_encode([
    'success'  => $sent1,
    'conf'     => $conf,
    'message'  => $sent1 ? 'Email sent successfully' : 'Email failed — check server logs',
]);
