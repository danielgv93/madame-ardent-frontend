export const FORM_STATUS = {
  PENDING: 'pending',
  READ: 'read',
  REPLIED: 'replied'
} as const;

export type FormStatus = typeof FORM_STATUS[keyof typeof FORM_STATUS];

export const FORM_STATUS_LABELS = {
  [FORM_STATUS.PENDING]: 'Pendiente',
  [FORM_STATUS.READ]: 'Leído',
  [FORM_STATUS.REPLIED]: 'Respondido'
} as const;

export const FORM_STATUS_COLORS = {
  [FORM_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [FORM_STATUS.READ]: 'bg-blue-100 text-blue-800',
  [FORM_STATUS.REPLIED]: 'bg-green-100 text-green-800'
} as const;

export const VALID_FORM_STATUS = Object.values(FORM_STATUS);