import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-display font-bold text-primary text-glow-primary mb-4">404</h1>
        <p className="text-2xl font-display text-white mb-8">Page Not Found</p>
        <Link href="/" className="px-8 py-3 rounded-full bg-primary text-[#000814] font-display font-bold tracking-wider hover:bg-primary/90 transition-all">GO HOME</Link>
      </div>
    </div>
  );
}
