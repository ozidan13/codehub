import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations that require elevated permissions
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Storage bucket name for file uploads
export const STORAGE_BUCKET = 'learning-tracker-files'

// Helper function to upload files
export async function uploadFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file)

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data
}

// Helper function to get public URL for uploaded files
export function getPublicUrl(path: string) {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}

// Helper function to delete files
export async function deleteFile(path: string) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}