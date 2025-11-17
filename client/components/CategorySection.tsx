import { useState, ReactNode } from 'react';

interface CategorySectionProps {
  title: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CategorySection({ title, count, children, defaultOpen = false }: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between h-[58px] px-6 bg-white border border-[#E2E8F0] rounded-[10px] hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#0F172B] text-base leading-6 font-normal">{title}</span>
          <span className="text-[#62748E] text-base leading-6 font-normal">({count} flavours)</span>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="#90A1B9"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children}
        </div>
      )}
    </div>
  );
}
