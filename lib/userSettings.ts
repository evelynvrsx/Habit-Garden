import { supabase } from './supabase';

export interface UserSettings {
  user_id: string;
  reinforcement_mode: number;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') { // 42P01 is "relation does not exist"
        // Row missing or table missing, create default (or just return default)
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_settings')
            .insert([{ user_id: userId, reinforcement_mode: 100 }])
            .select()
            .single();
          if (insertError) throw insertError;
          return newData;
        }
        return { user_id: userId, reinforcement_mode: 100 };
      }
      throw error;
    }
    return data;
  } catch (err) {
    console.warn('getUserSettings error, returning default:', err);
    return { user_id: userId, reinforcement_mode: 100 };
  }
}

export async function updateReinforcementRate(userId: string, rate: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, reinforcement_mode: rate, updated_at: new Date().toISOString() });

    if (error) throw error;
  } catch (err) {
    console.error('updateReinforcementRate error:', err);
    throw err;
  }
}
