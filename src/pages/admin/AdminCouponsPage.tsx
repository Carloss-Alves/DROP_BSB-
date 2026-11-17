import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { adminFetchCoupons, adminUpsertCoupon, adminDeleteCoupon, uploadBannerImage } from '@/services/admin';
import type { Coupon, CouponBenefitType } from '@/types';
import { Field, inputClass, textareaClass } from '@/components/admin/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';
import { Ticket } from 'lucide-react';

const BENEFIT_LABELS: Record<CouponBenefitType, string> = {
  discount_percent: 'Desconto percentual (%)',
  discount_amount: 'Desconto em valor (R$)',
  gift: 'Brinde',
  voucher: 'Voucher',
  special: 'Benefício especial',
};

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  id: '', code: '', name: '', description: '', min_purchase: '',
  benefit_type: 'discount_percent' as CouponBenefitType, benefit_value: '', benefit_label: '',
  banner_image_url: '', starts_at: '', ends_at: '', is_active: true,
};

export function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof emptyForm | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { notify } = useToast();

  async function load() {
    setLoading(true);
    try { setItems(await adminFetchCoupons()); } catch (e: any) { notify(e.message, 'error'); } finally { setLoading(false); }
  }

  useEffect(() => { if (isSupabaseConfigured) load(); else setLoading(false); }, []);

  function isBenefitFinancial(type: CouponBenefitType) {
    return type === 'discount_percent' || type === 'discount_amount';
  }

  async function handleBannerUpload(file: File) {
    if (!form) return;
    setUploadingBanner(true);
    try {
      const url = await uploadBannerImage(file, `coupon-${form.code || 'novo'}`);
      setForm({ ...form, banner_image_url: url });
    } catch (e: any) { notify(e.message, 'error'); } finally { setUploadingBanner(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.code.trim()) { notify('Informe o código do cupom.', 'error'); return; }
    try {
      await adminUpsertCoupon({
        id: form.id || undefined,
        code: form.code.toUpperCase().trim(),
        name: form.name || null,
        description: form.description || null,
        min_purchase: form.min_purchase ? Number(form.min_purchase) : null,
        benefit_type: form.benefit_type,
        benefit_value: isBenefitFinancial(form.benefit_type) && form.benefit_value ? Number(form.benefit_value) : null,
        benefit_label: !isBenefitFinancial(form.benefit_type) ? (form.benefit_label || null) : null,
        banner_image_url: form.banner_image_url || null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
      });
      notify('Cupom salvo.');
      setForm(null);
      load();
    } catch (e: any) { notify(e.message, 'error'); }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Excluir cupom "${coupon.code}"? O histórico se perde — considere só desativar.`)) return;
    try { await adminDeleteCoupon(coupon.id); notify('Cupom excluído.'); load(); } catch (e: any) { notify(e.message, 'error'); }
  }

  async function handleDeactivate(coupon: Coupon) {
    try {
      await adminUpsertCoupon({ id: coupon.id, code: coupon.code, is_active: !coupon.is_active });
      notify(coupon.is_active ? 'Cupom desativado.' : 'Cupom ativado.');
      load();
    } catch (e: any) { notify(e.message, 'error'); }
  }

  function benefitSummary(c: Coupon): string {
    if (c.benefit_label) return c.benefit_label;
    if (c.benefit_type === 'discount_percent' && c.benefit_value) return `${c.benefit_value}% de desconto`;
    if (c.benefit_type === 'discount_amount' && c.benefit_value) return `R$ ${c.benefit_value} de desconto`;
    return '—';
  }

  function isExpired(c: Coupon): boolean {
    return Boolean(c.ends_at && new Date(c.ends_at).getTime() < Date.now());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-display text-3xl">Cupons</h1>
        <Button variant="primary" onClick={() => setForm(emptyForm)}><Plus size={16} /> Novo cupom</Button>
      </div>
      <p className="text-ink-400 text-sm mb-6 max-w-lg">
        Cupons ativos e dentro da vigência aparecem automaticamente na seção "Cupons" da Home, com código copiável e contador de validade. A validação do benefício acontece no atendimento (WhatsApp) — o cliente nunca consegue alterar valor, validade ou tipo pelo navegador.
      </p>

      {!isSupabaseConfigured ? (
        <EmptyState icon={Ticket} title="Conecte o Supabase" description="Configure as variáveis de ambiente para gerenciar cupons." />
      ) : loading ? <p className="text-ink-400 text-sm">Carregando…</p> : items.length === 0 ? (
        <EmptyState icon={Ticket} title="Nenhum cupom cadastrado" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400 border-b border-ink-800">
                <th className="py-3 pr-4 font-medium">Código</th>
                <th className="py-3 pr-4 font-medium">Campanha</th>
                <th className="py-3 pr-4 font-medium">Benefício</th>
                <th className="py-3 pr-4 font-medium">Vigência</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => {
                const expired = isExpired(c);
                return (
                  <tr key={c.id} className="border-b border-ink-900">
                    <td className="py-3 pr-4 font-mono">{c.code}</td>
                    <td className="py-3 pr-4 text-ink-300">{c.name ?? '—'}</td>
                    <td className="py-3 pr-4">{benefitSummary(c)}</td>
                    <td className="py-3 pr-4 text-ink-400 text-xs">
                      {c.starts_at ? new Date(c.starts_at).toLocaleDateString('pt-BR') : '—'} até{' '}
                      {c.ends_at ? new Date(c.ends_at).toLocaleDateString('pt-BR') : 'sem prazo'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-sm ${
                        expired ? 'bg-ink-800 text-ink-500' : c.is_active ? 'bg-signal-500/20 text-signal-400' : 'bg-ink-800 text-ink-400'
                      }`}>
                        {expired ? 'Expirado' : c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setForm({
                          id: c.id, code: c.code, name: c.name ?? '', description: c.description ?? '',
                          min_purchase: c.min_purchase ? String(c.min_purchase) : '',
                          benefit_type: c.benefit_type ?? 'discount_percent',
                          benefit_value: c.benefit_value ? String(c.benefit_value) : '',
                          benefit_label: c.benefit_label ?? '',
                          banner_image_url: c.banner_image_url ?? '',
                          starts_at: toDatetimeLocal(c.starts_at), ends_at: toDatetimeLocal(c.ends_at),
                          is_active: c.is_active,
                        })} className="text-xs text-ink-400 hover:text-bone-50">Editar</button>
                        <button onClick={() => handleDeactivate(c)} className="text-xs text-ink-400 hover:text-bone-50">
                          {c.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => handleDelete(c)} className="text-ink-400 hover:text-sale-500"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-ink-900 border border-ink-700 rounded-md p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-5">
              <span className="text-display text-lg">{form.id ? 'Editar cupom' : 'Novo cupom'}</span>
              <button type="button" onClick={() => setForm(null)}><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome da campanha"><input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Campanha DROP100" /></Field>
                <Field label="Código do cupom"><input className={inputClass} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DROP100" required /></Field>
              </div>
              <Field label="Descrição"><textarea className={textareaClass} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Valor mínimo de compra (R$)" hint="Deixe em branco para não exigir mínimo">
                <input type="number" min={0} step="0.01" className={inputClass} value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: e.target.value })} />
              </Field>
              <Field label="Tipo de benefício">
                <select className={inputClass} value={form.benefit_type} onChange={e => setForm({ ...form, benefit_type: e.target.value as CouponBenefitType })}>
                  {Object.entries(BENEFIT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              {isBenefitFinancial(form.benefit_type) ? (
                <Field label={form.benefit_type === 'discount_percent' ? 'Percentual de desconto' : 'Valor do desconto (R$)'}>
                  <input type="number" min={0} step="0.01" className={inputClass} value={form.benefit_value} onChange={e => setForm({ ...form, benefit_value: e.target.value })} required />
                </Field>
              ) : (
                <Field label="Texto do benefício" hint='Ex: "Ganhe 1 dia de manicure no Salão Ra Role" — trate como demonstração até a loja confirmar a parceria real'>
                  <input className={inputClass} value={form.benefit_label} onChange={e => setForm({ ...form, benefit_label: e.target.value })} required />
                </Field>
              )}
              <Field label="Banner (opcional)">
                <label className="text-xs text-signal-400 cursor-pointer">
                  {uploadingBanner ? 'Enviando…' : form.banner_image_url ? 'Trocar imagem' : 'Enviar imagem'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleBannerUpload(e.target.files[0])} />
                </label>
                {form.banner_image_url && <img src={form.banner_image_url} alt="" className="mt-2 h-20 rounded-sm object-cover" />}
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Início da campanha (opcional)"><input type="datetime-local" className={inputClass} value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></Field>
                <Field label="Término da campanha"><input type="datetime-local" className={inputClass} value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={() => setForm({ ...form, is_active: !form.is_active })} className="accent-signal-500" /> Ativo</label>
            </div>
            <div className="flex gap-3 mt-6">
              <Button type="submit" variant="primary">Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
