export type Database = {
  public: {
    tables: {
      users: {
        Row: {
          id: number
          created_at: string
          firstname: string
          middlenames: string | null
          lastname: string
          whatsapp: string | null
          telegram: string | null
          primaryemail: string | null
          auth_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          firstname: string
          middlenames?: string | null
          lastname: string
          whatsapp?: string | null
          telegram?: string | null
          primaryemail?: string | null
          auth_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          firstname?: string
          middlenames?: string | null
          lastname?: string
          whatsapp?: string | null
          telegram?: string | null
          primaryemail?: string | null
          auth_id?: string | null
          updated_at?: string | null
        }
      }
    }
  }
} 