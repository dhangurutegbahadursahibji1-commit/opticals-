import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

export interface FilterState {
  category: string;
  gender: string;
  brand: string;
  sort: 'featured' | 'price-asc' | 'price-desc' | 'newest';
}

interface ProductFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: string[];
  genders: string[];
  brands: string[];
}

interface Option {
  value: string;
  label: string;
}

function PremiumSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'All',
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value ? options.find((o) => o.value === value)?.label : placeholder;

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] tracking-widest font-mono uppercase text-muted mb-1.5 ml-1">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-white/60 backdrop-blur-md px-4 py-3 text-sm text-primary shadow-sm outline-none transition-all hover:border-accent hover:bg-white/90 focus:border-accent"
      >
        <span className="font-medium truncate">{displayValue}</span>
        <RiArrowDownSLine
          className={`text-muted transition-transform duration-300 ml-2 shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 z-50 mt-2 w-full origin-top rounded-2xl border border-primary/10 bg-white/95 backdrop-blur-xl p-1.5 shadow-2xl"
          >
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              <button
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                  !value ? 'bg-accent/10 text-accent font-medium' : 'text-primary hover:bg-primary/5'
                }`}
              >
                {placeholder}
                {!value && <RiCheckLine />}
              </button>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors mt-1 ${
                    value === opt.value ? 'bg-accent/10 text-accent font-medium' : 'text-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <RiCheckLine className="shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductFilters({
  filters,
  onChange,
  categories,
  genders,
  brands,
}: ProductFiltersProps) {
  const update = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });

  const formatOpts = (arr: string[]) =>
    arr.map((item) => ({ value: item, label: item[0].toUpperCase() + item.slice(1) }));

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-primary/5 rounded-3xl p-4 border border-primary/10">
      <PremiumSelect
        label="Category"
        value={filters.category}
        options={formatOpts(categories)}
        onChange={(val) => update('category', val)}
      />
      <PremiumSelect
        label="Gender"
        value={filters.gender}
        options={formatOpts(genders)}
        onChange={(val) => update('gender', val)}
      />
      <PremiumSelect
        label="Brand"
        value={filters.brand}
        options={brands.map((b) => ({ value: b, label: b }))}
        onChange={(val) => update('brand', val)}
      />

      <PremiumSelect
        label="Sort By"
        value={filters.sort}
        options={sortOptions}
        onChange={(val) => update('sort', val)}
        placeholder="Featured"
      />
    </div>
  );
}
