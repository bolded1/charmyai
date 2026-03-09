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
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  heading?: string
  bodyText?: string
  buttonText?: string
  footerText?: string
  welcomeSteps?: string[]
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  heading = 'Welcome to Charmy!',
  bodyText,
  buttonText = 'Verify Email',
  footerText = "If you didn't create an account, you can safely ignore this email.",
  welcomeSteps,
}: SignupEmailProps) => {
  const steps = welcomeSteps && welcomeSteps.length > 0 ? welcomeSteps : [
    'Upload your first invoice or receipt',
    'Review the AI-extracted data',
    'Approve and export to your accounting workflow',
  ]

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Confirm your email to get started with Charmy</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src="https://vhaursnvaadhxxwefxez.supabase.co/storage/v1/object/public/email-images/charmy-logo.png" alt="Charmy" width="40" height="40" style={logoImg} />
          </Section>
          <Hr style={divider} />
          <Heading style={h1}>{heading}</Heading>
          {bodyText ? (
            bodyText.split('\n').filter(Boolean).map((line, i) => (
              <Text key={i} style={text}>{line}</Text>
            ))
          ) : (
            <>
              <Text style={text}>
                Thanks for signing up — you're just one step away from getting started.
              </Text>
              <Text style={text}>
                Please confirm your email address (
                <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
                ) by clicking the button below:
              </Text>
            </>
          )}
          <Section style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
            <Button style={button} href={confirmationUrl}>
              {buttonText}
            </Button>
          </Section>

          {/* Onboarding steps */}
          <Hr style={divider} />
          <Heading style={h2}>Getting started is easy</Heading>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            {steps.map((step, i) => (
              <tr key={i}>
                <td style={stepNumber}>{i + 1}</td>
                <td style={stepText}>{step}</td>
              </tr>
            ))}
          </table>
          <Text style={{ ...text, marginTop: '20px' }}>
            Questions? Just reply to this email — we're happy to help.
          </Text>

          <Text style={footer}>{footerText}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '8px' }
const logoMark = { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #1E3A8A, #2563EB)', color: '#ffffff', fontSize: '16px', textAlign: 'center' as const, verticalAlign: 'middle' as const, fontWeight: 'bold' as const }
const logoText = { fontSize: '18px', fontWeight: 'bold' as const, color: '#0a0f1a', paddingLeft: '8px', verticalAlign: 'middle' as const }
const divider = { borderColor: '#e5e7eb', margin: '16px 0 24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0a0f1a', margin: '0 0 16px' }
const h2 = { fontSize: '16px', fontWeight: '600' as const, color: '#0a0f1a', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#1E3A8A', textDecoration: 'underline' }
const button = { backgroundColor: '#1E3A8A', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '8px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
const stepNumber = { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: '#1E3A8A', fontSize: '13px', fontWeight: '600' as const, textAlign: 'center' as const, verticalAlign: 'top' as const, paddingTop: '5px' }
const stepText = { fontSize: '13px', color: '#374151', lineHeight: '1.5', paddingLeft: '12px', paddingBottom: '12px', verticalAlign: 'top' as const }
