import Link from "next/link";

export default function NotFound() {
  return (
    <main className="gutter flex min-h-svh flex-col items-start justify-center gap-8 bg-ink">
      <p className="caption text-mute">404</p>
      <h1 className="serif text-h1">nothing here.</h1>
      <Link href="/" className="btn btn-primary">
        <span>go back</span>
      </Link>
    </main>
  );
}
