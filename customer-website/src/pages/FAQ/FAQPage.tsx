import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RiArrowDownSLine } from 'react-icons/ri';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import { fetchFaqs } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export default function FAQPage() {
  // Previously read from a static mock JSON file, so FAQs edited through the
  // admin FAQs page never actually reached the storefront (see PROJECT_STATUS).
  const { data: faqs = [] } = useQuery({ queryKey: ['faqs'], queryFn: fetchFaqs });
  const { storeName } = useSettings();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return faqs.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [faqs, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof faqs>();
    filtered.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    });
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-4xl px-6 md:px-12 py-14">
      <SEOHead title="FAQ" description={`Frequently asked questions about returns, warranty, lens replacement, eye testing, delivery and payment at ${storeName}.`} />
      <SectionHeading eyebrow="Need Help?" title="Frequently Asked Questions" />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search FAQs..."
        aria-label="Search FAQs"
        className="w-full mb-8 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-card px-4 py-3 text-sm outline-none focus:border-accent"
      />

      {Array.from(grouped.entries()).map(([cat, items]) => (
        <div key={cat} className="mb-8">
          <h2 className="font-display text-xl text-primary dark:text-surface mb-3">{cat}</h2>
          <div className="space-y-2">
            {items.map((f) => (
              <div key={f.id} className="rounded-xl border border-primary/10 dark:border-white/10 overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium"
                  aria-expanded={openId === f.id}
                >
                  {f.question}
                  <RiArrowDownSLine className={`transition-transform ${openId === f.id ? 'rotate-180' : ''}`} />
                </button>
                {openId === f.id && <p className="px-4 pb-4 text-sm text-muted">{f.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="text-muted text-center py-10">No results for "{query}".</p>}
    </div>
  );
}
