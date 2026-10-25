// Static env references are required for Next.js client-side substitution.
export function supabasePublicKey(
  publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  legacy = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
) {
  return publishable?.trim() || legacy?.trim() || undefined;
}
