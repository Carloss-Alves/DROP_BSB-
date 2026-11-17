import type { Brand, Category } from '@/types';

export interface ProductFilters {
  brands: string[];
  categories: string[];
  sizes: string[];
  onlyNew: boolean;
  onlySale: boolean;
}

const APPAREL_SIZES = ['P', 'M', 'G', 'GG', 'GGG'];
// Só até 42 na lista geral de filtros — 43/44 existem no cadastro do Chinelo
// Nike Victori One, mas não precisam poluir o filtro (Seção 10 do briefing).
const SANDAL_SIZES = ['38', '39', '40', '41', '42'];

export function FilterPanel({
  brandOptions,
  categoryOptions,
  filters,
  onChange,
}: {
  brandOptions: Brand[];
  categoryOptions: Category[];
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
}) {
  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
  }

  // Filtro de tamanho inteligente: só mostra os grupos relevantes para a(s)
  // categoria(s) selecionada(s) — chinelo não mostra P/M/G, roupa não mostra
  // numeração (Seção 11 do briefing).
  const selectedCategorySlugs = filters.categories;
  const isChinelosOnly = selectedCategorySlugs.length > 0 && selectedCategorySlugs.every(s => s === 'chinelos');
  const hasApparelSelected = selectedCategorySlugs.some(s => s !== 'chinelos');
  const showApparelSizes = selectedCategorySlugs.length === 0 || hasApparelSelected;
  const showSandalSizes = selectedCategorySlugs.length === 0 || isChinelosOnly;

  function renderSizeGroup(label: string, sizes: string[]) {
    return (
      <div>
        {(showApparelSizes && showSandalSizes) && <span className="text-[10px] text-ink-500 uppercase tracking-widest block mb-1.5">{label}</span>}
        <div className="flex flex-wrap gap-2">
          {sizes.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => onChange({ ...filters, sizes: toggle(filters.sizes, size) })}
              className={`h-9 px-3 rounded-sm border text-xs ${
                filters.sizes.includes(size) ? 'border-ink-100 bg-ink-100 text-ink-950' : 'border-ink-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-300 mb-3 block">Marca</span>
        <div className="flex flex-col gap-2">
          {brandOptions.map(b => (
            <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.brands.includes(b.slug)}
                onChange={() => onChange({ ...filters, brands: toggle(filters.brands, b.slug) })}
                className="accent-signal-500"
              />
              {b.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-300 mb-3 block">Categoria</span>
        <div className="flex flex-col gap-2">
          {categoryOptions.map(c => (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(c.slug)}
                onChange={() => onChange({ ...filters, categories: toggle(filters.categories, c.slug) })}
                className="accent-signal-500"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-300 mb-3 block">Tamanho</span>
        <div className="flex flex-col gap-4">
          {showApparelSizes && renderSizeGroup('Roupas', APPAREL_SIZES)}
          {showSandalSizes && renderSizeGroup('Chinelos', SANDAL_SIZES)}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-300 mb-3 block">Disponibilidade</span>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={filters.onlyNew} onChange={() => onChange({ ...filters, onlyNew: !filters.onlyNew })} className="accent-signal-500" />
            Novidades
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={filters.onlySale} onChange={() => onChange({ ...filters, onlySale: !filters.onlySale })} className="accent-signal-500" />
            Em oferta
          </label>
        </div>
      </div>
    </div>
  );
}

export const EMPTY_FILTERS: ProductFilters = { brands: [], categories: [], sizes: [], onlyNew: false, onlySale: false };
