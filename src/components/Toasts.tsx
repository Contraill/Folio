import { Toaster } from 'sonner';
import { useStore } from '@/lib/store';

export default function Toasts() {
  const effective = useStore((s) => s.effective);
  return <Toaster position="bottom-center" theme={effective === 'paper' ? 'light' : 'dark'} toastOptions={{ style: { borderRadius: 14, fontFamily: 'var(--fb)' } }} />;
}
