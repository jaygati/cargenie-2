export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      car_models: {
        Row: {
          id: string
          make: string
          model: string
          year_min: number
          year_max: number
          body_type: string
          seats: number
          fuel_type: string
          mpg_city: number | null
          mpg_highway: number | null
          description: string | null
          specs: Json
          created_at: string
        }
        Insert: {
          id?: string
          make: string
          model: string
          year_min: number
          year_max: number
          body_type: string
          seats?: number
          fuel_type?: string
          mpg_city?: number | null
          mpg_highway?: number | null
          description?: string | null
          specs?: Json
          created_at?: string
        }
        Update: {
          id?: string
          make?: string
          model?: string
          year_min?: number
          year_max?: number
          body_type?: string
          seats?: number
          fuel_type?: string
          mpg_city?: number | null
          mpg_highway?: number | null
          description?: string | null
          specs?: Json
          created_at?: string
        }
      }
      listing_instances: {
        Row: {
          id: string
          car_model_id: string | null
          price: number
          year: number
          mileage: number
          seller: string
          location: string
          lat: number | null
          lon: number | null
          source_url: string | null
          source_platform: string | null
          scraped_at: string
          status: string
          images: Json
          created_at: string
        }
        Insert: {
          id?: string
          car_model_id?: string | null
          price: number
          year: number
          mileage?: number
          seller: string
          location: string
          lat?: number | null
          lon?: number | null
          source_url?: string | null
          source_platform?: string | null
          scraped_at?: string
          status?: string
          images?: Json
          created_at?: string
        }
        Update: {
          id?: string
          car_model_id?: string | null
          price?: number
          year?: number
          mileage?: number
          seller?: string
          location?: string
          lat?: number | null
          lon?: number | null
          source_url?: string | null
          source_platform?: string | null
          scraped_at?: string
          status?: string
          images?: Json
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          listing_instance_id: string | null
          user_email: string | null
          user_phone: string | null
          user_name: string | null
          tracked_url: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_instance_id?: string | null
          user_email?: string | null
          user_phone?: string | null
          user_name?: string | null
          tracked_url: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_instance_id?: string | null
          user_email?: string | null
          user_phone?: string | null
          user_name?: string | null
          tracked_url?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          name: string
          type: string
          commission_rate: number
          api_key: string | null
          contact_email: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string
          commission_rate?: number
          api_key?: string | null
          contact_email?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          commission_rate?: number
          api_key?: string | null
          contact_email?: string | null
          active?: boolean
          created_at?: string
        }
      }
    }
  }
}
