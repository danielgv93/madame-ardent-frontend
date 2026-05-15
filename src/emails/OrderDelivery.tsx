import { Section, Text } from '@react-email/components';
import BrandLayout from './BrandLayout';
import { CtaButton, EditorialHeading, Eyebrow, FieldRow, MetaLine, Paragraph } from './primitives';
import { theme } from './theme';

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
}

export default function OrderDelivery({
  orderId,
  customerEmail,
  totalFormatted,
  items,
  expirationDays,
  maxDownloads,
  shopUrl,
}: OrderDeliveryProps) {
  return (
    <BrandLayout preview={`Tu pedido está listo. Descarga tus archivos.`}>
      <Eyebrow>Tu pedido</Eyebrow>
      <EditorialHeading>¡Gracias por tu compra!</EditorialHeading>

      <Paragraph>
        Hemos recibido tu pago correctamente. A continuación tienes los enlaces de descarga
        para los productos que has comprado.
      </Paragraph>

      <MetaLine>
        Referencia: <strong>{orderId}</strong> · {customerEmail}
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
            <CtaButton href={item.downloadUrl}>Descargar</CtaButton>
          </Section>
        ))}
      </Section>

      <div style={{ marginTop: '24px' }}>
        <FieldRow label="Total pagado" value={totalFormatted} />
      </div>

      <Paragraph style={{ marginTop: '32px', fontSize: '14px', color: theme.colors.muted }}>
        Los enlaces son válidos durante <strong>{expirationDays} días</strong> y permiten
        un máximo de <strong>{maxDownloads} descargas</strong> por producto. Guarda los
        archivos en un lugar seguro tras descargarlos.
      </Paragraph>

      <Paragraph style={{ fontSize: '14px', color: theme.colors.muted }}>
        ¿Algún problema con tu descarga? Responde directamente a este correo y te ayudo
        en cuanto pueda. También puedes seguir explorando recursos en{' '}
        <a href={shopUrl} style={{ color: theme.colors.primary }}>
          la tienda
        </a>
        .
      </Paragraph>
    </BrandLayout>
  );
}
