import { Resend } from 'resend';
import { DigestConfirmationEmail } from '../emails/DigestConfirmation';
import { createElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendDigestConfirmationEmailParams {
  to: string;
  digestName: string;
  description?: string;
  frequency: string;
  sourceCount: number;
}

export async function sendDigestConfirmationEmail({
  to,
  digestName,
  description,
  frequency,
  sourceCount,
}: SendDigestConfirmationEmailParams) {
  try {
    const data = await resend.emails.send({
      from: 'Digest.wtf <notifications@digest.wtf>',
      to,
      subject: `Your new digest "${digestName}" is ready! 🎉`,
      react: createElement(DigestConfirmationEmail, {
        digestName,
        description,
        frequency,
        sourceCount,
      }),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send digest confirmation email:', error);
    return { success: false, error };
  }
} 