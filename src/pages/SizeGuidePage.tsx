import { useState } from 'react';
import { Ruler, Maximize2, ArrowDown, Scan } from 'lucide-react';

const mensJeansSizes = [
  { size: '28', waist: 28, hip: 34, inseam: 30 }, { size: '30', waist: 30, hip: 36, inseam: 30 },
  { size: '32', waist: 32, hip: 38, inseam: 32 }, { size: '34', waist: 34, hip: 40, inseam: 32 },
  { size: '36', waist: 36, hip: 42, inseam: 32 }, { size: '38', waist: 38, hip: 44, inseam: 34 },
];

const womensJeansSizes = [
  { size: '24', waist: 24, hip: 34 }, { size: '25', waist: 25, hip: 35 },
  { size: '26', waist: 26, hip: 36 }, { size: '27', waist: 27, hip: 37 },
  { size: '28', waist: 28, hip: 38 }, { size: '29', waist: 29, hip: 39 },
  { size: '30', waist: 30, hip: 40 }, { size: '32', waist: 32, hip: 42 },
];

const coatSizes = [
  { size: 'XS', chest: 34 }, { size: 'S', chest: 36 }, { size: 'M', chest: 38 },
  { size: 'L', chest: 40 }, { size: 'XL', chest: 42 }, { size: 'XXL', chest: 44 },
];

export default function SizeGuidePage() {
  return (
    <div>
      <div className="bg-stone-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold">Size Guide</h1>
          <p className="text-stone-300 mt-2">Find your perfect fit with our comprehensive measurement guide.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <SizeTable title="Men's Jeans" headers={['Size', 'Waist (in)', 'Waist (cm)', 'Hip (in)', 'Hip (cm)', 'Inseam (in)']}
          rows={mensJeansSizes.map(s => [s.size, String(s.waist), String(Math.round(s.waist * 2.54)), String(s.hip), String(Math.round(s.hip * 2.54)), String(s.inseam)])} />

        <SizeTable title="Women's Jeans" headers={['Size', 'Waist (in)', 'Waist (cm)', 'Hip (in)', 'Hip (cm)']}
          rows={womensJeansSizes.map(s => [s.size, String(s.waist), String(Math.round(s.waist * 2.54)), String(s.hip), String(Math.round(s.hip * 2.54))])} />

        <SizeTable title="Coats (Men's & Women's)" headers={['Size', 'Chest (in)', 'Chest (cm)']}
          rows={coatSizes.map(s => [s.size, String(s.chest), String(Math.round(s.chest * 2.54))])} />

        <div>
          <h2 className="font-display text-2xl font-bold mb-6">How to Measure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Ruler, title: 'Waist', text: 'Measure around your natural waistline.' },
              { icon: Maximize2, title: 'Hip', text: 'Measure around the fullest part of your hips.' },
              { icon: ArrowDown, title: 'Inseam', text: 'Measure from crotch to desired hem length.' },
              { icon: Scan, title: 'Chest', text: 'Measure under arms around the fullest part.' },
            ].map((m, i) => (
              <div key={i} className="border border-stone-200 p-5 text-center">
                <m.icon size={28} className="mx-auto mb-3 text-stone-700" />
                <h3 className="font-medium text-sm mb-1">{m.title}</h3>
                <p className="text-xs text-stone-500">{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-stone-50 p-8">
          <h2 className="font-display text-xl font-bold mb-4">Fit Tips</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-stone-600">
            <div>
              <h3 className="font-medium text-stone-900 mb-2">Jeans</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Denim stretches with wear — buy snug.</li>
                <li>Raw denim shrinks 3-5% on first wash; size up.</li>
                <li>Stretch denim (2%+ elastane) runs true to size.</li>
                <li>If between sizes, size down for slim fits, up for relaxed.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-stone-900 mb-2">Coats</h3>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Coats should accommodate layering underneath.</li>
                <li>Check the product fit guide for model measurements.</li>
                <li>Wool coats may run large — consider sizing down.</li>
                <li>Puffer jackets: size up for thick sweaters.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-stone-300">{headers.map(h => <th key={h} className="text-left py-3 px-4 font-medium text-stone-700">{h}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={i} className="border-b border-stone-100">{row.map((cell, j) => <td key={j} className="py-3 px-4 text-stone-600">{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
