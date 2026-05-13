import type { ContactFormInput } from '../types/index.js';
import BrandLayout from './BrandLayout';
import {
  CtaButton,
  EditorialHeading,
  Eyebrow,
  FieldRow,
  MetaLine,
  QuoteBlock,
} from './primitives';
import { theme } from './theme';

interface Props {
  data: ContactFormInput;
}

export default function ContactNotification({ data }: Props) {
  const receivedAt = new Date().toLocaleString('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <BrandLayout preview={`Nueva solicitud de ${data.name} — ${data.services}`}>
      <Eyebrow>Nueva solicitud</Eyebrow>
      <EditorialHeading>{data.name}</EditorialHeading>
      <MetaLine>Recibido el {receivedAt}</MetaLine>

      <FieldRow label="Usuario" value={data.user} />
      <FieldRow
        label="Email"
        value={
          <a href={`mailto:${data.email}`} style={{ color: theme.colors.primary, textDecoration: 'none' }}>
            {data.email}
          </a>
        }
      />
      <FieldRow label="País" value={data.country} />
      <FieldRow label="Servicio" value={data.services} />
      <FieldRow label="Presupuesto" value={data.budget} />

      <div style={{ marginTop: '28px' }}>
        <Eyebrow>Mensaje</Eyebrow>
        <QuoteBlock>{data.message}</QuoteBlock>
      </div>

      <CtaButton href={`${theme.siteUrl}/dashboard/forms`}>Ver en el panel</CtaButton>
    </BrandLayout>
  );
}
