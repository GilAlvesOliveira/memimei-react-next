import HeaderBar from "../components/HeaderBar";
import PromoBanner from "../components/PromoBanner";
import BrandButton from "../components/BrandButton";
import FooterLinks from "../components/FooterLinks";
import brands from "../lib/brands";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderBar />

      <main className="flex-1">
        <PromoBanner />

        <div className="w-full max-w-screen-md mx-auto px-3 py-6 space-y-3">
          {brands.map((name) => (
            <BrandButton key={name} label={name} />
          ))}
        </div>
      </main>

      <FooterLinks />
    </div>
  );
}
