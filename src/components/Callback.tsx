import { useEffect, useState } from "react";
import { userManager } from "../lib/auth";
import { Loader2 } from "lucide-react";

export default function Callback() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        userManager.signinRedirectCallback()
            .then(() => {
                window.location.href = "/";
            })
            .catch((err) => {
                console.error("Sign-in failed", err);
                setError("We couldn't sign you in. Please try again.");
            });
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-navy">
            {error ? (
                <>
                    <p className="text-cream/70 text-sm">{error}</p>
                    <a href="/" className="text-gold text-sm hover:underline">Back to invoices</a>
                </>
            ) : (
                <>
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                    <p className="text-cream/50 text-sm">Signing you in...</p>
                </>
            )}
        </div>
    );
}