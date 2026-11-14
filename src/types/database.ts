
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "instaladores": {
                  Row: {
                    "activo": boolean,"certificacion": string | null,"creado_en": string,"id": string,"nombre": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"certificacion"?: string | null,"creado_en"?: string,"id": string,"nombre": string
                  }
                  Update: {
                    "activo"?: boolean,"certificacion"?: string | null,"creado_en"?: string,"id"?: string,"nombre"?: string
                  }
                  Relationships: [
                    
                  ]
                },"materiales": {
                  Row: {
                    "costo_unitario": number,"id": string,"nombre": string,"sku": string,"stock": number,"unidad": string
                  }
                  ComputedFields: never
                  Insert: {
                    "costo_unitario": number,"id"?: string,"nombre": string,"sku": string,"stock"?: number,"unidad"?: string
                  }
                  Update: {
                    "costo_unitario"?: number,"id"?: string,"nombre"?: string,"sku"?: string,"stock"?: number,"unidad"?: string
                  }
                  Relationships: [
                    
                  ]
                },"proyecto_instaladores": {
                  Row: {
                    "asignado_en": string,"instalador_id": string,"proyecto_id": string,"rol": string
                  }
                  ComputedFields: never
                  Insert: {
                    "asignado_en"?: string,"instalador_id": string,"proyecto_id": string,"rol"?: string
                  }
                  Update: {
                    "asignado_en"?: string,"instalador_id"?: string,"proyecto_id"?: string,"rol"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyecto_instaladores_instalador_id_fkey"
      columns: ["instalador_id"]
isOneToOne: false
      referencedRelation: "instaladores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyecto_instaladores_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    }
                  ]
                },"proyecto_materiales": {
                  Row: {
                    "cantidad": number,"material_id": string,"proyecto_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad": number,"material_id": string,"proyecto_id": string
                  }
                  Update: {
                    "cantidad"?: number,"material_id"?: string,"proyecto_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyecto_materiales_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "disponibilidad"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyecto_materiales_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materiales"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "proyecto_materiales_proyecto_id_fkey"
      columns: ["proyecto_id"]
isOneToOne: false
      referencedRelation: "proyectos"
      referencedColumns: ["id"]
    }
                  ]
                },"proyectos": {
                  Row: {
                    "actualizado_en": string,"capacidad_kwp": number,"cliente": string,"codigo": string,"creado_en": string,"creado_por": string,"direccion": string,"estado": Database["public"]['Enums']["estado_proyecto"],"fecha_fin": string | null,"fecha_inicio": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actualizado_en"?: string,"capacidad_kwp": number,"cliente": string,"codigo": string,"creado_en"?: string,"creado_por": string,"direccion": string,"estado"?: Database["public"]['Enums']["estado_proyecto"],"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: string
                  }
                  Update: {
                    "actualizado_en"?: string,"capacidad_kwp"?: number,"cliente"?: string,"codigo"?: string,"creado_en"?: string,"creado_por"?: string,"direccion"?: string,"estado"?: Database["public"]['Enums']["estado_proyecto"],"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "proyectos_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "instaladores"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "disponibilidad": {
                  Row: {
                    "disponible": number | null,"id": string,"nombre": string,"reservado": number | null,"sku": string,"stock": number,"unidad": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "es_coordinador":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"esta_asignado":
{ Args: { "p_proyecto": string }; Returns: boolean
                           }
          }
          Enums: {
            "estado_proyecto": "pendiente"|"en_progreso"|"completado"|"cancelado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "estado_proyecto": ["pendiente", "en_progreso", "completado", "cancelado"]
          }
        }
} as const
