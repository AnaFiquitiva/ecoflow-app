import { describe, expect, it } from 'vitest';
import { cn, formatFecha, formatKwp } from '@/lib/utils';

describe('cn', () => {
  it('resuelve clases de Tailwind en conflicto quedándose con la última', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
  it('ignora valores falsos', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b');
  });
});

describe('formatKwp', () => {
  it('siempre muestra dos decimales y la unidad', () => {
    expect(formatKwp(9)).toContain('kWp');
    expect(formatKwp(9)).toMatch(/9[.,]00/);
  });
});

describe('formatFecha', () => {
  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatFecha(null)).toBe('—');
  });
  it('no desplaza el día por zona horaria', () => {
    // Sin la hora local explícita, new Date('2026-03-10') se interpreta en UTC
    // y en America/Bogota (UTC-5) retrocedería al día 9.
    expect(formatFecha('2026-03-10')).toContain('10');
  });
});
