import { Section, Text } from 'react-email';
import BrandLayout from './BrandLayout';
import { CtaButton, EditorialHeading, Eyebrow, FieldRow, MetaLine, Paragraph } from './primitives';
import { theme } from './theme';
import { emailMessages, type EmailLang } from './i18n';

export interface OrderDeliveryItem {
  title: string;
  quantity: number;
  downloadUrl: string;
}

export interface OrderDeliveryProps {
  orderId: string;
  customerEmail: string;
  totalFormatted: string;
  items: OrderDeliveryItem[];
  expirationDays: number;
  maxDownloads: number;
  shopUrl: string;
  lang: EmailLang;
}

export default function OrderDelivery({
  orderId,
  customerEmail,
  totalFormatted,
  items,
  expirationDays,
  maxDownloads,
  shopUrl,
  lang,
}: OrderDeliveryProps) {
  const m = emailMessages(lang).orderDelivery;
  return (
    <BrandLayout lang={lang} preview={m.preview}>
      <Eyebrow>{m.eyebrow}</Eyebrow>
      <EditorialHeading>{m.heading}</EditorialHeading>

      <Paragraph>{m.intro}</Paragraph>

      <MetaLine>
        {m.referenceLabel}: <strong>{orderId}</strong> · {customerEmail}
      </MetaLine>

      <Section style={{ margin: '24px 0' }}>
        {items.map((item, idx) => (
          <Section
            key={idx}
            style={{
              padding: '20px 0',
              borderBottom: `1px solid ${theme.colors.line}`,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: '17px',
                color: theme.colors.ink,
                margin: '0 0 4px',
                fontWeight: 500,
              }}
            >
              {item.title}
              {item.quantity > 1 ? ` × ${item.quantity}` : ''}
            </Text>
            <CtaButton href={item.downloadUrl}>{m.downloadButton}</CtaButton>
          </Section>
        ))}
      </Section>

      <div style={{ marginTop: '24px' }}>
        <FieldRow label={m.totalLabel} value={totalFormatted} />
      </div>

      <Paragraph style={{ marginTop: '32px', fontSize: '14px', color: theme.colors.muted }}>
        {m.expiryNote(expirationDays, maxDownloads)}
      </Paragraph>

      <Paragraph style={{ fontSize: '14px', color: theme.colors.muted }}>
        {m.helpNote(shopUrl)}
      </Paragraph>
    </BrandLayout>
  );
}
