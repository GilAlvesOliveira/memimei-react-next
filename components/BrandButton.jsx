export default function BrandButton({ label }) {
  return (
    <button
      type="button"
      className="w-full py-4 rounded-xl border border-slate-300 text-black font-semibold text-lg"
      // por enquanto sem ação
    >
      {label}
    </button>
  );
}
