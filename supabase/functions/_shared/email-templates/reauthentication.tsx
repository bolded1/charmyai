/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
  heading?: string
  bodyText?: string
  footerText?: string
}

export const ReauthenticationEmail = ({
  token,
  heading = 'Verification code',
  bodyText = 'Use the code below to confirm your identity:',
  footerText = "This code will expire shortly. If you didn't request this, you can safely ignore it.",
}: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Charmy verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
            <Img src="https://vhaursnvaadhxxwefxez.supabase.co/storage/v1/object/public/email-images/charmy-logo.png" alt="Charmy" width="40" height="40" style={logoImg} />
          </Section>
        <Hr style={divider} />
        <Heading style={h1}>{heading}</Heading>
        <Text style={text}>{bodyText}</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>{footerText}</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '8px', textAlign: 'center' as const }
const logoImg = { borderRadius: '12px' }
const divider = { borderColor: '#e5e7eb', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0f1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#1E8A4A', letterSpacing: '4px', margin: '0 0 30px', textAlign: 'center' as const }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
