import { useState, useEffect } from "react";

interface ProductCardProps {
  name: string;
  strength: string;
  available: number;
  multipleOf: number;
  onSelect: (quantity: number) => void;
  resetTrigger?: number;
}

export function ProductCard({
  name,
  strength,
  available,
  multipleOf,
  onSelect,
  resetTrigger,
}: ProductCardProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [quantity, setQuantity] = useState<number | null>(null);

  // Reset state when resetTrigger changes
  useEffect(() => {
    setIsChecked(false);
    setQuantity(null);
  }, [resetTrigger]);

  const numOptions = Math.ceil(available / multipleOf);
  const quantities = Array.from(
    { length: numOptions },
    (_, i) => (i + 1) * multipleOf,
  ).filter((q) => q <= available);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
    if (isChecked) {
      setQuantity(null);
      onSelect(0);
    }
  };

  const handleQuantityChange = (value: string) => {
    const qty = parseInt(value);
    setQuantity(qty);
    setIsChecked(true);
    onSelect(qty);
  };

  return (
    <div className="flex flex-col gap-3 p-4 pb-1 border border-[#E2E8F0] rounded-[10px] bg-white">
      <div className="flex items-start gap-3">
        <button
          onClick={handleCheckboxChange}
          className="w-4 h-4 mt-0.5 rounded border border-black/10 bg-[#F3F3F5] shadow-sm flex items-center justify-center flex-shrink-0"
        >
          {isChecked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6L5 9L10 3"
                stroke="#009966"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="text-[#0F172B] text-sm leading-[14px] font-normal mb-1">
            {name}
          </div>
          <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg border border-black/10">
            <span className="text-[#0A0A0A] text-xs leading-4 font-normal">
              {strength}
            </span>
          </div>
        </div>
      </div>

      <div className="text-[#009966] text-sm leading-5 font-normal">
        Available: {available} pcs
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[#45556C] text-xs leading-4 font-normal">
          Quantity (multiples of {multipleOf})
        </label>
        <select
          value={quantity || ""}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="h-9 px-3 flex items-center justify-between rounded-lg bg-[#F3F3F5] border border-transparent text-sm leading-5 font-normal appearance-none cursor-pointer opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath opacity='0.5' d='M4 6L8 10L12 6' stroke='%23717182' stroke-width='1.33333' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "40px",
          }}
        >
          <option value="" disabled>
            Select quantity
          </option>
          {quantities.map((q) => (
            <option key={q} value={q}>
              {q} pcs
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
