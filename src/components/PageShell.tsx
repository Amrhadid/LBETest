import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";

/** Header + Footer wrapper reused by the stub inner pages. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
