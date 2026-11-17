import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/Logo";

export default function InterestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-border-light bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 md:px-12 lg:px-20">
          <Logo />
          <Link
            href="/plans"
            className="text-[13px] font-medium text-ink-secondary hover:text-ink"
          >
            ← Back to Krishi
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}