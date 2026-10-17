import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="flex min-h-screen items-center justify-center bg-starfield p-6 text-foreground">
            <div className="w-full max-w-md space-y-6 text-center">
                <h1 className="text-7xl font-light text-foreground/25">404</h1>
                <p className="font-light leading-relaxed text-foreground/60">
                    The page <span className="text-foreground/80">"{pageName}"</span> doesn't exist.
                </p>
                <Link
                    to="/"
                    className="inline-flex rounded-2xl border border-accent/40 px-5 py-3 text-sm text-accent transition-all hover:bg-accent/[0.06]"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
