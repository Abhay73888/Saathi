import Link from 'next/link';

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-sm text-sand-600 mb-4">
        <Link href="/" className="text-teal-700 font-bold">Home</Link> / {title}
      </nav>
      <h1 className="font-display text-3xl md:text-4xl text-teal-900 mb-2">{title}</h1>
      <p className="text-sm text-sand-600 mb-8">Last updated: {updated}</p>
      <div className="prose-sm space-y-8">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-bold text-lg mb-2">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-[15px] text-sand-600 leading-relaxed mb-2">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
