import BrandLayout from './BrandLayout';
import { Eyebrow, Paragraph } from './primitives';
import { theme } from './theme';
import { emailMessages, type EmailLang } from './i18n';

interface Props {
  bodyHtml: string;
  originalMessage: string;
  lang: EmailLang;
}

export default function ReplyEmail({ bodyHtml, originalMessage, lang }: Props) {
  const m = emailMessages(lang).reply;
  return (
    <BrandLayout lang={lang} preview={m.preview}>
      <div
        style={{
          fontFamily: theme.fonts.serif,
          fontSize: '16px',
          lineHeight: 1.7,
          color: theme.colors.body,
        }}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      <div
        style={{
          marginTop: '36px',
          paddingTop: '24px',
          borderTop: `1px solid ${theme.colors.line}`,
        }}
      >
        <Eyebrow>{m.originalMessageEyebrow}</Eyebrow>
        <Paragraph
          style={{
            fontSize: '14px',
            color: theme.colors.muted,
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {originalMessage}
        </Paragraph>
      </div>
    </BrandLayout>
  );
}
