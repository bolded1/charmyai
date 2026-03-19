/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  heading?: string
  bodyText?: string
  buttonText?: string
  footerText?: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
  heading = "You've been invited",
  bodyText = 'Someone invited you to join Charmy. Click the button below to accept and create your account.',
  buttonText = 'Accept Invitation',
  footerText = "If you weren't expecting this invitation, you can safely ignore this email.",
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join Charmy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
            <Img src="https://vhaursnvaadhxxwefxez.supabase.co/storage/v1/object/public/email-images/charmy-logo.png" alt="Charmy" width="40" height="40" style={logoImg} />
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

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '8px', textAlign: 'center' as const }
const logoImg = { borderRadius: '12px' }
const divider = { borderColor: '#e5e7eb', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0f1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#1E8A4A', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
