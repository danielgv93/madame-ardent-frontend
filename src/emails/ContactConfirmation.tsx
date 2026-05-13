import type { ContactFormInput } from '../types/index.js';
import BrandLayout from './BrandLayout';
import {
  EditorialHeading,
  Eyebrow,
  FieldRow,
  Paragraph,
  QuoteBlock,
} from './primitives';

interface Props {
  data: ContactFormInput;
}

export default function ContactConfirmation({ data }: Props) {
  return (
    <BrandLayout preview={`Recibimos tu mensaje, ${data.name}. Te respondemos en breve.`}>
      <Eyebrow>Confirmación</Eyebrow>
      <EditorialHeading>Gracias, {data.name}.</EditorialHeading>

      <Paragraph>
        Recibí tu solicitud y la revisaré con detenimiento. En breve te
        responderé al correo <strong>{data.email}</strong> con los próximos pasos.
      </Paragraph>

      <div style={{ marginTop: '32px' }}>
        <Eyebrow>Tu solicitud</Eyebrow>
        <FieldRow label="Servicio" value={data.services} />
        <FieldRow label="Presupuesto" value={data.budget} />
      </div>

      <div style={{ marginTop: '28px' }}>
        <Eyebrow>Tu mensaje</Eyebrow>
        <QuoteBlock>{data.message}</QuoteBlock>
      </div>

      <Paragraph style={{ marginTop: '24px' }}>
        Si necesitas añadir algo más, responde directamente a este correo.
      </Paragraph>
    </BrandLayout>
  );
}
