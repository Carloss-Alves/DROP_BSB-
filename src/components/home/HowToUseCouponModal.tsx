import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Coupon } from '@/types';

const STEPS = [
  'Escolha seus produtos.',
  'Adicione ao carrinho.',
  'Informe o código do cupom ao finalizar pelo WhatsApp.',
  'Confira se o valor mínimo foi atingido.',
  'Veja o benefício disponível.',
  'Finalize o pedido conforme o fluxo da loja.',
];

export function HowToUseCouponModal({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {coupon && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-ink-900 border border-ink-700 rounded-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-display text-lg">Como usar</span>
              <button onClick={onClose} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-ink-300 mb-4">
              Código <span className="font-mono text-signal-400">{coupon.code}</span>
              {coupon.min_purchase ? ` — válido para compras acima de ${coupon.min_purchase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}.
            </p>

            <ol className="flex flex-col gap-2.5 mb-4">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-200">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-ink-800 text-[11px] flex items-center justify-center">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            {coupon.benefit_type === 'special' || coupon.benefit_type === 'voucher' || coupon.benefit_type === 'gift' ? (
              <p className="text-xs text-ink-500 border-t border-ink-800 pt-3">
                Este benefício é uma campanha especial da DROP BSB — as condições finais são confirmadas no atendimento pelo WhatsApp.
              </p>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
