import { toast } from 'sonner';

export async function copyText(text: string, done: string, blocked: string) {
  try { await navigator.clipboard.writeText(text); toast.success(done); } catch { toast(blocked); }
}
