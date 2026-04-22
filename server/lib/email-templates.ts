const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fafafa;
  margin: 0;
  padding: 0;
`;

const cardStyle = `
  max-width: 480px;
  margin: 48px auto;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 40px 36px;
`;

const logoStyle = `
  font-size: 18px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 28px;
  display: block;
`;

const headingStyle = `
  font-size: 22px;
  font-weight: 700;
  color: #18181b;
  margin: 0 0 12px;
`;

const bodyStyle = `
  font-size: 15px;
  color: #52525b;
  line-height: 1.6;
  margin: 0 0 28px;
`;

const buttonStyle = `
  display: inline-block;
  background: #18181b;
  color: #ffffff !important;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 28px;
  border-radius: 999px;
  margin-bottom: 24px;
`;

const footerStyle = `
  font-size: 12px;
  color: #a1a1aa;
  line-height: 1.6;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #f4f4f5;
`;

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="${baseStyle}">
    <div style="${cardStyle}">
      <span style="${logoStyle}">🔥 Streakly</span>
      ${content}
      <p style="${footerStyle}">
        You're receiving this because you signed up for Streakly.<br />
        If you didn't, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;
}

export function verificationEmail(url: string) {
  return baseTemplate(`
    <h1 style="${headingStyle}">Verify your email</h1>
    <p style="${bodyStyle}">
      Thanks for signing up! Click the button below to verify your email
      address and start building your streaks.
    </p>
    <a href="${url}" style="${buttonStyle}">Verify email →</a>
    <p style="font-size:13px;color:#a1a1aa;margin:0;">
      This link expires in 24 hours.
    </p>
  `);
}

export function passwordResetEmail(url: string) {
  return baseTemplate(`
    <h1 style="${headingStyle}">Reset your password</h1>
    <p style="${bodyStyle}">
      We received a request to reset your Streakly password.
      Click the button below to choose a new one.
    </p>
    <a href="${url}" style="${buttonStyle}">Reset password →</a>
    <p style="font-size:13px;color:#a1a1aa;margin:0;">
      This link expires in 1 hour. If you didn't request a reset, ignore this email — your password won't change.
    </p>
  `);
}

export function magicLinkEmail(url: string) {
  return baseTemplate(`
    <h1 style="${headingStyle}">Your sign-in link</h1>
    <p style="${bodyStyle}">
      Click the button below to sign in to Streakly. No password needed.
    </p>
    <a href="${url}" style="${buttonStyle}">Sign in →</a>
    <p style="font-size:13px;color:#a1a1aa;margin:0;">
      This link expires in 10 minutes and can only be used once.
    </p>
  `);
}
