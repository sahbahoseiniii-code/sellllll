import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface FilterValues {
  colors: string[];
  sizes: string[];
  fits: string[];
  priceMin: number;
  priceMax: number;
  sortBy: string;
}

export const defaultFilters: FilterValues = {
  colors: [], sizes: [], fits: [], priceMin: 0, priceMax: 500, sortBy: 'featured',
};

const colorOptions = [
  { name: 'Black', hex: '#1a1a1a' }, { name: 'Indigo Blue', hex: '#3B4F6C' },
  { name: 'Dark Indigo', hex: '#2C3E6B' }, { name: 'Light Blue', hex: '#A8C4DC' },
  { name: 'Stone Wash', hex: '#B8C4D0' }, { name: 'Ecru', hex: '#F0EBD8' },
  { name: 'Camel', hex: '#C9A96E' }, { name: 'Charcoal', hex: '#4A4A4A' },
  { name: 'Navy', hex: '#1B2A4A' }, { name: 'Forest Green', hex: '#2D5A27' },
  { name: 'Cream', hex: '#F5F0E8' }, { name: 'Caramel', hex: '#A0714F' },
  { name: 'Dark Brown', hex: '#3D2B1F' }, { name: 'Olive', hex: '#556B2F' },
];

const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '24', '25', '26', '27', '28', '29', '30', '31', '32', '34', '36'];
const fitOptions = ['Slim', 'Regular', 'Relaxed', 'Skinny', 'Wide Leg', 'Straight'];
const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

export default function FilterSidebar({ filters, onChange, totalCount }: {
  filters: FilterValues;
  onChange: (f: FilterValues) => void;
  totalCount: number;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sort: true, price: true, color: true, size: true, fit: false,
  });

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleArrayValue = (key: 'colors' | 'sizes' | 'fits', value: string) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] });
  };

  const activeCount = filters.colors.length + filters.sizes.length + filters.fits.length +
    (filters.priceMin !== 0 || filters.priceMax !== 500 ? 1 : 0) + (filters.sortBy !== 'featured' ? 1 : 0);

  const clearAll = () => onChange(defaultFilters);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          Filters
          {activeCount > 0 && <span className="text-xs bg-stone-900 text-white px-2 py-0.5 rounded-full">{activeCount}</span>}
        </h2>
        {activeCount > 0 && <button onClick={clearAll} className="text-xs text-stone-500 hover:text-stone-900 underline">Clear All</button>}
      </div>

      <Section title="Sort By" open={openSections.sort} onToggle={() => toggle('sort')}>
        <div className="space-y-2">
          {sortOptions.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-stone-700">
              <input type="radio" name="sort" checked={filters.sortBy === opt.value}
                onChange={() => onChange({ ...filters, sortBy: opt.value })} className="accent-stone-900" />
              {opt.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Price Range" open={openSections.price} onToggle={() => toggle('price')}>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={filters.priceMin || ''} min={0}
            onChange={e => onChange({ ...filters, priceMin: Number(e.target.value) || 0 })}
            className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
          <span className="text-stone-400">—</span>
          <input type="number" placeholder="Max" value={filters.priceMax !== 500 ? filters.priceMax : ''} min={0}
            onChange={e => onChange({ ...filters, priceMax: Number(e.target.value) || 500 })}
            className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
        </div>
      </Section>

      <Section title="Color" open={openSections.color} onToggle={() => toggle('color')}>
        <div className="grid grid-cols-2 gap-2">
          {colorOptions.map(c => (
            <label key={c.name} className="flex items-center gap-2 cursor-pointer text-sm text-stone-700">
              <input type="checkbox" checked={filters.colors.includes(c.name)}
                onChange={() => toggleArrayValue('colors', c.name)} className="accent-stone-900" />
              <span className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: c.hex }} />
              <span className="truncate">{c.name}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Size" open={openSections.size} onToggle={() => toggle('size')}>
        <div className="grid grid-cols-4 gap-2">
          {sizeOptions.map(s => (
            <button key={s} onClick={() => toggleArrayValue('sizes', s)}
              className={`py-2 text-xs font-medium border transition-colors ${filters.sizes.includes(s) ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700 hover:border-stone-500'}`}>
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Fit" open={openSections.fit} onToggle={() => toggle('fit')}>
        <div className="space-y-2">
          {fitOptions.map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer text-sm text-stone-700">
              <input type="checkbox" checked={filters.fits.includes(f)}
                onChange={() => toggleArrayValue('fits', f)} className="accent-stone-900" />
              {f}
            </label>
          ))}
        </div>
      </Section>

      <p className="text-xs text-stone-500 mt-4">{totalCount} {totalCount === 1 ? 'product' : 'products'}</p>
    </div>
  );
}

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-stone-200 py-4">
      <button onClick={onToggle} className="flex items-center justify-between w-full text-sm font-semibold text-stone-900 mb-3">
        {title}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  );
}
