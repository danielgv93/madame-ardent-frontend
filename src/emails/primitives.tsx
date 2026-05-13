import { Button, Heading, Section, Text } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';
import { theme } from './theme';

export function EditorialHeading({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h1"
      style={{
        fontFamily: theme.fonts.serif,
        fontSize: '28px',
        lineHeight: 1.2,
        color: theme.colors.ink,
        margin: '0 0 8px',
        fontWeight: 400,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </Heading>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: theme.fonts.sans,
        fontSize: '10px',
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: theme.colors.primary,
        margin: '0 0 16px',
        fontWeight: 600,
      }}
    >
      {children}
    </Text>
  );
}

export function Paragraph({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Text
      style={{
        fontFamily: theme.fonts.serif,
        fontSize: '16px',
        lineHeight: 1.6,
        color: theme.colors.body,
        margin: '0 0 16px',
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

interface FieldRowProps {
  label: string;
  value: ReactNode;
}

export function FieldRow({ label, value }: FieldRowProps) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{ borderBottom: `1px solid ${theme.colors.line}` }}
    >
      <tr>
        <td
          style={{
            padding: '14px 0',
            fontFamily: theme.fonts.sans,
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: theme.colors.subtle,
            width: '40%',
            verticalAlign: 'top',
          }}
        >
          {label}
        </td>
        <td
          style={{
            padding: '14px 0',
            fontFamily: theme.fonts.serif,
            fontSize: '15px',
            color: theme.colors.ink,
            verticalAlign: 'top',
          }}
        >
          {value}
        </td>
      </tr>
    </table>
  );
}

export function QuoteBlock({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: theme.colors.primarySoft,
        borderLeft: `3px solid ${theme.colors.primary}`,
        padding: '20px 24px',
        margin: '24px 0',
      }}
    >
      <Text
        style={{
          fontFamily: theme.fonts.serif,
          fontSize: '15px',
          lineHeight: 1.7,
          color: theme.colors.body,
          margin: 0,
          fontStyle: 'italic',
          whiteSpace: 'pre-wrap',
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ textAlign: 'center', margin: '32px 0 8px' }}>
      <Button
        href={href}
        style={{
          backgroundColor: theme.colors.primary,
          color: '#ffffff',
          fontFamily: theme.fonts.sans,
          fontSize: '13px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 600,
          padding: '14px 32px',
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function MetaLine({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: theme.fonts.sans,
        fontSize: '12px',
        color: theme.colors.muted,
        margin: '0 0 24px',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </Text>
  );
}
