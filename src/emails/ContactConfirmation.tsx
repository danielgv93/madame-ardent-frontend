import type { ContactFormInput } from '../types/index.js';
import BrandLayout from './BrandLayout';
import {
  EditorialHeading,
  Eyebrow,
  FieldRow,
  Paragraph,
  QuoteBlock,
} from './primitives';
import { emailMessages, type EmailLang } from './i18n';

interface Props {
  data: ContactFormInput;
  lang: EmailLang;
}

export default function ContactConfirmation({ data, lang }: Props) {
  const m = emailMessages(lang).contactConfirmation;
  return (
    <BrandLayout lang={lang} preview={m.preview(data.name)}>
      <Eyebrow>{m.eyebrow}</Eyebrow>
      <EditorialHeading>{m.heading(data.name)}</EditorialHeading>

      <Paragraph>{m.intro(data.email)}</Paragraph>

      <div style={{ marginTop: '32px' }}>
        <Eyebrow>{m.requestEyebrow}</Eyebrow>
        <FieldRow label={m.fieldService} value={data.services} />
        <FieldRow label={m.fieldBudget} value={data.budget} />
      </div>

      <div style={{ marginTop: '28px' }}>
        <Eyebrow>{m.messageEyebrow}</Eyebrow>
        <QuoteBlock>{data.message}</QuoteBlock>
      </div>

      <Paragraph style={{ marginTop: '24px' }}>{m.outro}</Paragraph>
    </BrandLayout>
  );
}
