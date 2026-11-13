import { describe, expect, it } from 'vitest';
import { nuevoProyectoForm, nuevoProyectoSchema } from '@/lib/schemas';

const base = {
  codigo: 'EF-0042',
  cliente: 'Cliente A',
  direccion: 'Calle 1 #23-45',
  capacidad_kwp: 9,
};

describe('nuevoProyectoSchema', () => {
  it('acepta un proyecto válido', () => {
    expect(nuevoProyectoSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza un código con formato distinto (CHECK codigo ~ EF-0000)', () => {
    for (const codigo of ['EF-42', 'ef-0042', '0042', 'EF-00042']) {
      expect(nuevoProyectoSchema.safeParse({ ...base, codigo }).success).toBe(false);
    }
  });

  it('rechaza capacidad no positiva o fuera de rango', () => {
    expect(nuevoProyectoSchema.safeParse({ ...base, capacidad_kwp: 0 }).success).toBe(false);
    expect(nuevoProyectoSchema.safeParse({ ...base, capacidad_kwp: -1 }).success).toBe(false);
    expect(nuevoProyectoSchema.safeParse({ ...base, capacidad_kwp: 501 }).success).toBe(false);
  });

  it('convierte la capacidad enviada como texto por el input', () => {
    const r = nuevoProyectoSchema.safeParse({ ...base, capacidad_kwp: '12.5' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.capacidad_kwp).toBe(12.5);
  });

  it('rechaza cliente o dirección demasiado cortos', () => {
    expect(nuevoProyectoSchema.safeParse({ ...base, cliente: 'AB' }).success).toBe(false);
    expect(nuevoProyectoSchema.safeParse({ ...base, direccion: 'C 1' }).success).toBe(false);
  });
});

describe('coherencia de fechas (constraint fechas_coherentes)', () => {
  it('rechaza un cierre anterior al inicio', () => {
    const r = nuevoProyectoForm.safeParse({
      ...base,
      fecha_inicio: '2026-03-10',
      fecha_fin: '2026-03-01',
    });
    expect(r.success).toBe(false);
  });

  it('acepta cierre igual o posterior al inicio', () => {
    for (const fecha_fin of ['2026-03-10', '2026-04-01']) {
      const r = nuevoProyectoForm.safeParse({
        ...base,
        fecha_inicio: '2026-03-10',
        fecha_fin,
      });
      expect(r.success).toBe(true);
    }
  });

  it('acepta un proyecto sin fechas', () => {
    expect(nuevoProyectoForm.safeParse(base).success).toBe(true);
  });
});
