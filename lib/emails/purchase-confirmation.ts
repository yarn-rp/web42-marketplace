interface PurchaseConfirmationProps {
  sellerUsername: string
  sellerEmail: string
  agentName: string
  agentUrl: string
  amountCents: number
}

export function purchaseConfirmationSubject(agentName: string) {
  return `You purchased ${agentName}`
}

export function purchaseConfirmationHtml({
  sellerUsername,
  sellerEmail,
  agentName,
  agentUrl,
  amountCents,
}: PurchaseConfirmationProps): string {
  const amount = `$${(amountCents / 100).toFixed(2)}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <style>
    :root { color-scheme: dark; }
    @media (prefers-color-scheme: dark) {
      body, .bg-body { background-color: #0f0f14 !important; }
      .bg-terminal { background-color: #1a1b26 !important; }
      .bg-titlebar { background-color: #16161e !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Menlo','Monaco','Courier New',monospace;" class="bg-body">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:32px 16px;" class="bg-body">
    <tr><td align="center">
      <!-- Tagline -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td align="center" style="padding:0 0 16px 0;">
            <span style="font-size:12px;color:#71717a;letter-spacing:0.5px;">The AI Agent Marketplace</span>
          </td>
        </tr>
      </table>
      <!-- Terminal window -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:12px;overflow:hidden;border:1px solid #2a2b3d;">
        <!-- Title bar -->
        <tr>
          <td style="background-color:#16161e;padding:12px 16px;border-bottom:1px solid #2a2b3d;" class="bg-titlebar">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:#ff5f57;margin-right:6px;"></span></td>
              <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:#febc2e;margin-right:6px;"></span></td>
              <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:#28c840;margin-right:8px;"></span></td>
              <td style="padding-left:16px;"><a href="https://web42.ai" target="_blank" style="text-decoration:none;"><img src="https://web42.ai/assets/logo/web42_logo_white.png" alt="Web42" width="80" style="display:inline-block;vertical-align:middle;border:0;" /></a></td>
            </tr></table>
          </td>
        </tr>
        <!-- Terminal body -->
        <tr>
          <td style="background-color:#1a1b26;padding:24px 20px;font-size:14px;line-height:1.7;" class="bg-terminal">
            <div style="color:#71717a;" class="t-cmd">$ web42 install ${escapeHtml(agentName)}</div>
            <div style="color:#4ade80;" class="t-ok">&gt; purchase confirmed!</div>
            <br/>
            <div style="color:#a1a1aa;" class="t-label">agent: &nbsp;&nbsp;<a href="${escapeHtml(agentUrl)}" target="_blank" style="color:#d4d4d8;text-decoration:none;" class="t-value">${escapeHtml(agentName)}</a></div>
            <div style="color:#a1a1aa;" class="t-label">creator: <a href="https://web42.ai/${escapeHtml(sellerUsername)}" target="_blank" style="color:#d4d4d8;text-decoration:none;" class="t-value">@${escapeHtml(sellerUsername)}</a></div>
            <div style="color:#a1a1aa;" class="t-label">email: &nbsp;&nbsp;<a href="mailto:${escapeHtml(sellerEmail)}" style="color:#60a5fa;text-decoration:underline;" class="t-link">${escapeHtml(sellerEmail)}</a></div>
            <div style="color:#a1a1aa;" class="t-label">paid: &nbsp;&nbsp;&nbsp;<span style="color:#d4d4d8;" class="t-value">${amount}</span></div>
            <br/>
            <div style="color:#4ade80;font-weight:600;" class="t-ok">&#10003; ${escapeHtml(agentName)} is now yours.</div>
            <div style="margin:16px 0;height:1px;background-color:#2a2b3d;"></div>
            <div style="color:#71717a;font-size:13px;" class="t-cmd">$ web42 next-steps</div>
            <div style="color:#a1a1aa;font-size:13px;line-height:1.8;margin-top:4px;" class="t-label">
              <span style="color:#4ade80;" class="t-bullet">&#8227;</span> <a href="${escapeHtml(agentUrl)}" target="_blank" style="color:#60a5fa;text-decoration:underline;" class="t-link">Get started with ${escapeHtml(agentName)}</a> &mdash; view docs and install instructions<br/>
              <span style="color:#4ade80;" class="t-bullet">&#8227;</span> <a href="mailto:${escapeHtml(sellerEmail)}?subject=Question%20about%20${encodeURIComponent(agentName)}" style="color:#60a5fa;text-decoration:underline;" class="t-link">Questions? Contact the creator</a> &mdash; <a href="https://web42.ai/${escapeHtml(sellerUsername)}" target="_blank" style="color:#d4d4d8;text-decoration:none;" class="t-value">@${escapeHtml(sellerUsername)}</a> can help<br/>
              <span style="color:#4ade80;" class="t-bullet">&#8227;</span> <a href="https://web42.ai/explore" target="_blank" style="color:#60a5fa;text-decoration:underline;" class="t-link">Browse more agents</a> &mdash; discover tools built by the community
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#16161e;padding:12px 20px;border-top:1px solid #2a2b3d;" class="bg-titlebar">
            <div style="font-size:11px;color:#52525b;" class="t-footer">You received this because you purchased an agent on <a href="https://web42.ai" style="color:#71717a;text-decoration:underline;">web42.ai</a></div>
          </td>
        </tr>
      </table>
      <!-- Company info -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td align="left" style="padding:24px 20px 0;font-size:11px;color:#52525b;line-height:1.6;" class="t-company">
            <div>This email relates to your purchase on <a href="https://web42.ai" style="color:#71717a;text-decoration:underline;font-weight:600;">Web42</a>.</div>
            <div style="margin-top:8px;">Blueprint AI LLC &middot; 70 NW 25th St, Miami, FL 33127</div>
            <div style="margin-top:4px;">
              <a href="https://web42.ai/terms" style="color:#52525b;text-decoration:underline;">Terms</a>
              &nbsp;&middot;&nbsp;
              <a href="https://web42.ai/privacy" style="color:#52525b;text-decoration:underline;">Privacy</a>
              &nbsp;&middot;&nbsp;
              <a href="https://web42.ai" style="color:#52525b;text-decoration:underline;">web42.ai</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
