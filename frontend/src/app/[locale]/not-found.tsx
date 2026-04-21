import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <p className="text-8xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
          404
        </p>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/" />}>
            Back to Home
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/generate" />}>
            Start Creating
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/gallery" />}>
            Browse Gallery
          </Button>
        </div>
      </main>
    </>
  );
}
