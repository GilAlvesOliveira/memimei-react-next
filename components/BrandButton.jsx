import Link from "next/link";

export default function BrandButton({ label, href, onClick }) {
  const baseClasses =
    "w-full py-4 rounded-xl border border-slate-300 text-black font-semibold text-lg text-center block";

  if (href) {
    return (
      <Link href={href} className={baseClasses} role="button">
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {label}
    </button>
  );
}
