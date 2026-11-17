import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import type { Coupon } from '@/types';
import { fetchActiveCoupons } from '@/services/catalog';
import { CouponCountdown } from './CouponCountdown';
import { HowToUseCouponModal } from './HowToUseCouponModal';

function benefitHeadline(coupon: Coupon): string {
  if (coupon.benefit_label) return coupon.benefit_label;
  if (coupon.benefit_type === 'discount_percent' && coupon.benefit_value) return `${coupon.benefit_value}% de desconto`;
  if (coupon.benefit_type === 'discount_amount' && coupon.benefit_value) {
    return `${coupon.benefit_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de desconto`;
  }
  return 'Benefício especial';
}

function CouponCard({ coupon, onExpire, onHowToUse }: { coupon: Coupon; onExpire: () => void; onHowToUse: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex: contexto não-seguro) — sem drama, só não mostra o feedback.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-md border border-ink-800 bg-gradient-to-br from-ink-900 to-ink-950 p-6 sm:p-8"
    >
      <span className="eyebrow">DROP BSB · Cupom especial</span>
      {coupon.min_purchase && (
        <p className="text-ink-300 text-sm mt-2">Compras acima de {coupon.min_purchase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      )}
      <h3 className="text-display text-2xl sm:text-3xl mt-1 leading-tight">{benefitHeadline(coupon)}</h3>
      {coupon.description && <p className="text-ink-400 text-sm mt-2">{coupon.description}</p>}

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-sm bg-ink-800 text-ink-100 text-sm font-semibold uppercase tracking-wide hover:bg-ink-700 transition-colors"
        >
          {copied ? <Check size={15} className="text-signal-400" /> : <Copy size={15} />}
          <span className="font-mono normal-case tracking-normal">{coupon.code}</span>
        </button>
        <button onClick={onHowToUse} className="text-xs text-ink-400 underline underline-offset-2 hover:text-bone-50">
          Como usar?
        </button>
        {copied && <span className="text-signal-400 text-xs">Cupom copiado!</span>}
      </div>

      {coupon.ends_at && (
        <div className="mt-4">
          <CouponCountdown endsAt={coupon.ends_at} onExpire={onExpire} />
        </div>
      )}
    </motion.div>
  );
}

export function CouponsSection() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [howToUseCoupon, setHowToUseCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchActiveCoupons()
      .then(setCoupons)
      .catch(err => console.error('Falha ao carregar cupons:', err))
      .finally(() => setLoading(false));
  }, []);

  function handleExpire(couponId: string) {
    setCoupons(prev => prev.filter(c => c.id !== couponId));
  }

  if (loading || coupons.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="mb-8">
        <span className="eyebrow">Benefícios</span>
        <h2 className="text-display text-3xl sm:text-4xl mt-1">Cupons</h2>
        <p className="text-ink-400 text-sm mt-2 max-w-md">Campanhas e benefícios especiais da DROP BSB.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {coupons.map(c => (
          <CouponCard key={c.id} coupon={c} onExpire={() => handleExpire(c.id)} onHowToUse={() => setHowToUseCoupon(c)} />
        ))}
      </div>
      <HowToUseCouponModal coupon={howToUseCoupon} onClose={() => setHowToUseCoupon(null)} />
    </section>
  );
}
