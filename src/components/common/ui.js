// Classes compartilhadas dos controles. As cores vêm dos tokens do tema,
// então os mesmos nomes servem para o claro e o escuro.

const base = 'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-[background-color,color,transform] duration-150 disabled:opacity-50';

// Altura 40 no mouse, 44 no toque
const size = 'h-10 px-4 text-sm pointer-coarse:h-11';
// Botões em bloco: rótulo mono em caixa alta, como uma tecla (mesma voz da landing)
const key = 'h-10 px-4 font-mono text-[12.5px] font-medium uppercase tracking-[0.06em] pointer-coarse:h-11';

export const btnPrimary = `${base} ${key} bg-accent-fill text-white hover:bg-accent-fill-hover`;
export const btnSecondary = `${base} ${key} bg-surface-2 text-ink hover:bg-line`;
export const btnGhost = `${base} ${size} text-ink-2 hover:bg-surface-2 hover:text-ink`;
export const btnDanger = `${base} ${key} bg-danger text-white hover:opacity-90`;

// Botão só com ícone: precisa de aria-label onde for usado
export const iconBtn = 'inline-flex items-center justify-center size-9 pointer-coarse:size-11 shrink-0 rounded-[var(--radius-control)] text-ink-2 hover:bg-surface-2 hover:text-ink transition-[background-color,color,transform] duration-150 disabled:opacity-40';

// Ícone sobre as barras escuras (topo do painel, controles da pré-visualização)
export const darkIcon = 'inline-flex items-center justify-center size-9 pointer-coarse:size-11 shrink-0 rounded-[var(--radius-control)] text-white/70 hover:bg-white/10 hover:text-white transition-[background-color,color,transform] duration-150 disabled:opacity-40';

// Sem largura: use quando o campo tem largura própria (w-24, w-28…); `field` já vem com w-full
export const fieldBase = 'rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2.5 text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:ring-2 focus:ring-accent/20 read-only:bg-surface-2 read-only:text-ink-2';
export const field = `w-full ${fieldBase}`;

export const label = 'mb-1.5 block text-sm font-semibold text-ink';
export const help = 'mt-1.5 text-xs leading-snug text-ink-3';
