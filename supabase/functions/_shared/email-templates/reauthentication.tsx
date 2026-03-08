/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
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
          <table><tr>
            <td style={logoMark}>✦</td>
            <td style={logoText}>Charmy</td>
          </tr></table>
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
const logoSection = { marginBottom: '8px' }
const logoMark = { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: '#ffffff', fontSize: '16px', textAlign: 'center' as const, verticalAlign: 'middle' as const, fontWeight: 'bold' as const }
const logoText = { fontSize: '18px', fontWeight: 'bold' as const, color: '#0a0f1a', paddingLeft: '8px', verticalAlign: 'middle' as const }
const divider = { borderColor: '#e5e7eb', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0f1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#1E3A8A', letterSpacing: '4px', margin: '0 0 30px', textAlign: 'center' as const }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
