export const T = {
  red:           '#C3212C',
  redDark:       '#640B0F',
  white:         '#FFFFFF',
  surface:       '#F9F8F8',
  bg:            '#F5F4F2',
  text:          '#111111',
  textSecondary: '#555555',
  border:        '#E5E5E5',
  green:         '#2D7D46',
  amber:         '#B45309',
};

export const btn = {
  primary: {
    padding: '9px 20px', fontSize: 14, fontWeight: 600, border: 'none',
    borderRadius: 6, background: T.red, color: T.white, cursor: 'pointer',
  },
  primarySm: {
    padding: '7px 14px', fontSize: 13, fontWeight: 600, border: 'none',
    borderRadius: 5, background: T.red, color: T.white, cursor: 'pointer',
  },
  outline: {
    padding: '7px 14px', fontSize: 13, fontWeight: 500,
    border: `1px solid ${T.red}`, borderRadius: 5, background: T.white,
    cursor: 'pointer', color: T.red,
  },
  ghost: {
    padding: '7px 14px', fontSize: 13, border: '1px solid #d1d5db',
    borderRadius: 5, background: T.white, cursor: 'pointer', color: T.textSecondary,
  },
};
