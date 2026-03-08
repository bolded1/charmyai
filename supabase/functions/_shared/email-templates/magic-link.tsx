/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  heading?: string
  bodyText?: string
  buttonText?: string
  footerText?: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
  heading = 'Your login link',
  bodyText = 'Click the button below to sign in to Charmy. This link will expire shortly.',
  buttonText = 'Sign In',
  footerText = "If you didn't request this link, you can safely ignore this email.",
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Charmy login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <table><tr>
            <td style={logoMark}>✦</td>
            <td style={logoText}>Charmy</td>
          </tr></table>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>{heading}</Heading>
        {bodyText.split('\n').filter(Boolean).map((line, i) => (
          <Text key={i} style={text}>{line}</Text>
        ))}
        <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
          <Button style={button} href={confirmationUrl}>
            {buttonText}
          </Button>
        </Section>
        <Text style={footer}>{footerText}</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '8px' }
const logoMark = { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: '#ffffff', fontSize: '16px', textAlign: 'center' as const, verticalAlign: 'middle' as const, fontWeight: 'bold' as const }
const logoText = { fontSize: '18px', fontWeight: 'bold' as const, color: '#0a0f1a', paddingLeft: '8px', verticalAlign: 'middle' as const }
const divider = { borderColor: '#e5e7eb', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0f1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#1E3A8A', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
