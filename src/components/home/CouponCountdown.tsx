import { useEffect, useState } from 'react';

function getRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  return {
    expired: diff <= 0,
    hours: Math.floor(clamped / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
  };
}

/**
 * Contador de validade de UM cupom específico (Seção 14/19 do briefing:
 * "o contador é SOMENTE do cupom", nada a ver com o antigo conceito de Drop
 * temporizado). Baseado em ends_at salvo no banco — nunca hardcoded.
 */
export function CouponCountdown({ endsAt, onExpire }: { endsAt: string; onExpire?: () => void }) {
  const [time, setTime] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getRemaining(endsAt);
      setTime(next);
      if (next.expired) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (time.expired) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="font-mono text-xs text-ink-400 tabular-nums" role="timer" aria-live="off">
      Válido por mais {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
    </span>
  );
}
