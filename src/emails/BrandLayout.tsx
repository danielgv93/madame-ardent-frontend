import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'react-email';
import type { ReactNode } from 'react';
import { theme } from './theme';

interface BrandLayoutProps {
  preview: string;
  children: ReactNode;
}

export default function BrandLayout({ preview, children }: BrandLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${theme.siteUrl}/email/madame-ardent.png`}
              alt="Madame Ardent"
              width="80"
              height="80"
              style={styles.logo}
            />
            <Text style={styles.wordmark}>Madame Ardent</Text>
            <Text style={styles.tagline}>Diseño editorial</Text>
          </Section>

          <Hr style={styles.rule} />

          <Section style={styles.content}>{children}</Section>

          <Hr style={styles.rule} />

          <Section style={styles.footer}>
            {/*
              GMAIL SIGNATURE PLACEHOLDER
              Pegá acá tu firma de Gmail (HTML). Reemplazá este bloque por
              el HTML que copies desde Gmail (Configuración → Firma).
              Ejemplo:
              <div style={{ fontFamily: theme.fonts.sans }}>
                Tu nombre · Madame Ardent<br />
                contacto@madame-ardent.com
              </div>
            */}
            <Text style={styles.footerText}>
              Madame Ardent — Diseño editorial para novelas.
            </Text>
            <Text style={styles.footerLink}>{theme.siteUrl.replace(/^https?:\/\//, '')}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: theme.colors.canvas,
    fontFamily: theme.fonts.serif,
    margin: 0,
    padding: '32px 0',
  },
  container: {
    backgroundColor: theme.colors.surface,
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0',
    borderTop: `4px solid ${theme.colors.primary}`,
  },
  header: {
    padding: '40px 48px 28px',
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto 12px',
    display: 'block',
  },
  wordmark: {
    fontFamily: theme.fonts.serif,
    fontSize: '24px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: theme.colors.ink,
    margin: '0 0 4px',
    fontWeight: 400,
  },
  tagline: {
    fontFamily: theme.fonts.sans,
    fontSize: '11px',
    letterSpacing: '0.32em',
    textTransform: 'uppercase' as const,
    color: theme.colors.primary,
    margin: 0,
    fontWeight: 600,
  },
  rule: {
    borderColor: theme.colors.line,
    borderWidth: '0 0 1px 0',
    margin: 0,
  },
  content: {
    padding: '40px 48px',
  },
  footer: {
    padding: '24px 48px 36px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontFamily: theme.fonts.sans,
    fontSize: '12px',
    color: theme.colors.muted,
    margin: '0 0 4px',
  },
  footerLink: {
    fontFamily: theme.fonts.sans,
    fontSize: '12px',
    color: theme.colors.primary,
    margin: 0,
    letterSpacing: '0.05em',
  },
};
