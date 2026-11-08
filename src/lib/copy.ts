export async function copyText(text: string, done: string, blocked: string) {
  const { toast } = await import('sonner');
  try { await navigator.clipboard.writeText(text); toast.success(done); } catch { toast(blocked); }
}
