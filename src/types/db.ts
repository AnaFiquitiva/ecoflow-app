/**
 * Contrato de la base de datos.
 *
 * Este archivo NO se escribe a mano. Se regenera tras cada migración con:
 *   npm run types:db
 * que ejecuta `supabase gen types typescript`. Es la pieza que mantiene una
 * sola fuente de verdad: si una columna cambia, la compilación rompe aquí en
 * lugar de fallar en producción.
 */

export type EstadoProyecto =
  | 'pendiente'
  | 'en_progreso'
  | 'completado'
  | 'cancelado';

export interface Database {
  public: {
    Tables: {
      instaladores: {
        Row: {
          id: string;
          nombre: string;
          certificacion: string | null;
          activo: boolean;
          creado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          certificacion?: string | null;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          certificacion?: string | null;
          activo?: boolean;
        };
        Relationships: [];
      };
      materiales: {
        Row: {
          id: string;
          sku: string;
          nombre: string;
          unidad: string;
          stock: number;
          costo_unitario: number;
        };
        Insert: {
          sku: string;
          nombre: string;
          unidad?: string;
          stock?: number;
          costo_unitario: number;
        };
        Update: { nombre?: string; unidad?: string };
        Relationships: [];
      };
      proyectos: {
        Row: {
          id: string;
          codigo: string;
          cliente: string;
          direccion: string;
          estado: EstadoProyecto;
          capacidad_kwp: number;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          creado_por: string;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: {
          codigo: string;
          cliente: string;
          direccion: string;
          estado?: EstadoProyecto;
          capacidad_kwp: number;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
          creado_por: string;
        };
        // codigo, creado_por y creado_en no están: el privilegio de columna
        // está revocado en 0002_rls.sql, así que tampoco se ofrecen en el tipo.
        Update: {
          cliente?: string;
          direccion?: string;
          estado?: EstadoProyecto;
          capacidad_kwp?: number;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
        };
        Relationships: [];
      };
      proyecto_instaladores: {
        Row: {
          proyecto_id: string;
          instalador_id: string;
          rol: string;
          asignado_en: string;
        };
        Insert: { proyecto_id: string; instalador_id: string; rol?: string };
        Update: { rol?: string };
        Relationships: [];
      };
      proyecto_materiales: {
        Row: { proyecto_id: string; material_id: string; cantidad: number };
        Insert: { proyecto_id: string; material_id: string; cantidad: number };
        Update: { cantidad?: number };
        Relationships: [];
      };
    };
    Views: {
      disponibilidad: {
        Row: {
          id: string;
          sku: string;
          nombre: string;
          unidad: string;
          stock: number;
          reservado: number;
          disponible: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: { estado_proyecto: EstadoProyecto };
    CompositeTypes: Record<string, never>;
  };
}

/** Atajos de dominio derivados del contrato, no redefinidos. */
export type Proyecto = Database['public']['Tables']['proyectos']['Row'];
export type ProyectoInsert = Database['public']['Tables']['proyectos']['Insert'];
export type ProyectoUpdate = Database['public']['Tables']['proyectos']['Update'];
export type Instalador = Database['public']['Tables']['instaladores']['Row'];
export type Material = Database['public']['Tables']['materiales']['Row'];
export type Disponibilidad = Database['public']['Views']['disponibilidad']['Row'];
