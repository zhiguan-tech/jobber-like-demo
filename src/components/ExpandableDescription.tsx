'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function ExpandableDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>{open ? 'Hide details' : 'Show details'}</span>
      </button>
      {open && (
        <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{text}</p>
      )}
    </div>
  );
}
