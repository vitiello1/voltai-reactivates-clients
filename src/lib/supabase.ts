import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      professionals: {
        Row: {
          id: string;
          name: string;
          salon_name: string;
          email: string;
          whatsapp_number: string | null;
          whatsapp_connected: boolean;
          evolution_instance_name: string | null;
          evolution_api_key: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['professionals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['professionals']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          professional_id: string;
          name: string;
          interval_days: number;
          message_template: string;
          is_custom: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          professional_id: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          professional_id: string;
          client_id: string;
          service_id: string;
          date: string;
          return_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          appointment_id: string;
          professional_id: string;
          sent_at: string;
          status: 'sent' | 'failed';
          returned_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
    };
  };
};
