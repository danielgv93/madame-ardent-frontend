import BrandLayout from './BrandLayout';
import { Eyebrow, Paragraph } from './primitives';
import { theme } from './theme';

interface Props {
  bodyHtml: string;
  originalMessage: string;
}

export default function ReplyEmail({ bodyHtml, originalMessage }: Props) {
  return (
    <BrandLayout preview="Respuesta de Madame Ardent">
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
        <Eyebrow>Mensaje original</Eyebrow>
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
