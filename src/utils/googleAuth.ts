import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token with Gmail scope');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Encodes string to RFC 4648 Base64URL
 */
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends a password reset OTP directly to Nasir's registered Gmail using the Gmail API
 */
export async function sendOtpViaGmailApi(
  accessToken: string,
  recipientEmail: string,
  otpCode: string,
  validityMinutes: number = 15
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const expiresDate = new Date(Date.now() + validityMinutes * 60 * 1000);
    const expiresFormatted = expiresDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const emailSubject = `🔐 Nasir's Biodata: Admin Password Reset OTP [${otpCode}]`;
    const emailBody = [
      `Assalamu Alaikum Md. Nasir Uddin,`,
      ``,
      `You have requested a One-Time Password (OTP) to reset the administrator password for your Matrimonial Biodata website.`,
      ``,
      `════════════════════════════════════════`,
      `YOUR 6-DIGIT OTP CODE:  ${otpCode}`,
      `════════════════════════════════════════`,
      ``,
      `⏱ Validity Period: ${validityMinutes} minutes (expires at ${expiresFormatted}).`,
      ``,
      `Please enter this 6-digit code on the Admin verification screen to set your new master password.`,
      `If you did not request this OTP, you can safely ignore this email.`,
      ``,
      `Warm regards,`,
      `Nasir's Biodata Administrative Gateway`,
    ].join('\r\n');

    // RFC 2822 formatted raw email string
    const rawMessage = [
      `To: ${recipientEmail}`,
      `Subject: ${emailSubject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      emailBody,
    ].join('\r\n');

    const encodedMessage = base64UrlEncode(rawMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.error?.message || `Gmail API responded with status ${response.status}`);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('Error sending email via Gmail API:', err);
    return { success: false, error: err.message || 'Failed to send email via Gmail API' };
  }
}
