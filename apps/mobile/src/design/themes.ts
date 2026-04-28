import { tokens } from './tokens';

export const dark = {
  // Backgrounds
  bg:              tokens.color.slate900,
  surface:         tokens.color.slate800,
  surfaceHover:    tokens.color.slate700,
  overlay:         tokens.color.slate900,

  // Text
  text:            tokens.color.slate100,
  textMuted:       tokens.color.slate400,

  // Structure
  border:          tokens.color.slate700,

  // Brand
  primary:         tokens.color.indigo500,
  primaryHover:    tokens.color.indigo400,
  primarySubtle:   tokens.color.indigo500a13,

  // Status
  success:         tokens.color.green500,
  successSubtle:   tokens.color.green500a15,
  warning:         tokens.color.amber500,
  warningSubtle:   tokens.color.amber500a15,
  danger:          tokens.color.red500,
  dangerSubtle:    tokens.color.red500a15,

  // Chat
  userBubble:      tokens.color.indigo500,
  assistantBubble: tokens.color.slate800,
};
