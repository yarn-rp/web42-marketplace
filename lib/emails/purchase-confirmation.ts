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
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Menlo','Monaco','Courier New',monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:12px;overflow:hidden;border:1px solid #2a2b3d;">
        <!-- Title bar -->
        <tr>
          <td style="background-color:#16161e;padding:12px 16px;border-bottom:1px solid #2a2b3d;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:#ff5f57;margin-right:6px;"></span></td>
              <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:#febc2e;margin-right:6px;"></span></td>
              <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:#28c840;margin-right:8px;"></span></td>
              <td><span style="font-size:12px;color:#71717a;">web42</span></td>
            </tr></table>
          </td>
        </tr>
        <!-- Terminal body -->
        <tr>
          <td style="background-color:#1a1b26;padding:24px 20px;font-size:14px;line-height:1.7;">
            <div style="color:#71717a;">$ web42 checkout --complete</div>
            <div style="color:#4ade80;">&gt; purchase confirmed!</div>
            <br/>
            <div style="color:#a1a1aa;">agent: &nbsp;&nbsp;<span style="color:#d4d4d8;">${escapeHtml(agentName)}</span></div>
            <div style="color:#a1a1aa;">creator: <span style="color:#d4d4d8;">@${escapeHtml(sellerUsername)}</span></div>
            <div style="color:#a1a1aa;">email: &nbsp;&nbsp;<a href="mailto:${escapeHtml(sellerEmail)}" style="color:#60a5fa;text-decoration:underline;">${escapeHtml(sellerEmail)}</a></div>
            <div style="color:#a1a1aa;">paid: &nbsp;&nbsp;&nbsp;<span style="color:#d4d4d8;">${amount}</span></div>
            <br/>
            <div style="color:#4ade80;font-weight:600;">✓ ${escapeHtml(agentName)} is now yours.</div>
            <div style="margin:16px 0;height:1px;background-color:#2a2b3d;"></div>
            <div>
              <a href="${escapeHtml(agentUrl)}" target="_blank" style="color:#60a5fa;text-decoration:underline;font-size:13px;">View agent →</a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#16161e;padding:12px 20px;border-top:1px solid #2a2b3d;">
            <div style="font-size:11px;color:#52525b;">You received this because you purchased an agent on <a href="https://web42.ai" style="color:#71717a;text-decoration:underline;">web42.ai</a></div>
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
