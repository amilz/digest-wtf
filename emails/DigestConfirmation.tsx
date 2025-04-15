import * as React from 'react';
import {
  Html,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Heading,
} from '@react-email/components';

interface DigestConfirmationEmailProps {
  digestName: string;
  description?: string;
  frequency: string;
  sourceCount: number;
}

export const DigestConfirmationEmail: React.FC<DigestConfirmationEmailProps> = ({
  digestName,
  description,
  frequency,
  sourceCount,
}) => {
  const frequencyText = frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();

  return (
    <Html>
      <Preview>Your new digest "{digestName}" has been created! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to your new digest!</Heading>
          <Section style={section}>
            <Text style={text}>
              Great news! Your digest "{digestName}" has been successfully created.
            </Text>
            {description && (
              <Text style={text}>
                Description: {description}
              </Text>
            )}
            <Text style={text}>
              You'll receive updates {frequencyText}, compiled from {sourceCount} source{sourceCount !== 1 ? 's' : ''}.
            </Text>
            <Text style={text}>
              Expect your first digest within the next 24 hours. We're excited to help you stay informed!
            </Text>
          </Section>
          <Text style={footer}>
            You're receiving this email because you created a new digest on{' '}
            <Link href="https://digest.wtf" style={link}>
              digest.wtf
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const section = {
  padding: '24px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '16px 0',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '12px 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  margin: '24px 0',
};

export default DigestConfirmationEmail; 