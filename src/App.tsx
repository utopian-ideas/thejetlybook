import { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import { getUser, isAuthenticated, signIn, signOut, getOrganisations } from "./lib/auth";
import { apiGet } from "./lib/api";
import Callback from "./components/Callback";
import InvoiceList from "./components/InvoiceList";
import NewInvoiceForm from "./components/NewInvoiceForm";

type View = "list" | "new-invoice";

export default function App() {
    if (window.location.pathname === "/callback") {
        return <Callback />;
    }

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authed, setAuthed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [organisation, setOrganisation] = useState<any>(null);

    const [view, setView] = useState<View>("list");
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            const authenticated = await isAuthenticated();
            setAuthed(authenticated);
            if (authenticated) {
                const currentUser = await getUser();
                setUser(currentUser);
                const orgs = await getOrganisations(currentUser);
                setOrganisation(orgs[0]);
                // Ensure a book exists for this org before anything else can happen
                await apiGet("get_or_create_book.php", {
                    organisation_id: orgs[0].id,
                    user_id: currentUser.profile.sub,
                });
            }
            setCheckingAuth(false);
        }
        init();
    }, []);

    async function loadInvoices() {
        if (!organisation) return;
        setLoadingInvoices(true);
        setLoadError(null);
        try {
            const result = await apiGet("get_invoices.php", { organisation_id: organisation.id });
            if (result.success) {
                setInvoices(result.invoices ?? []);
            } else {
                setLoadError("We couldn't load your invoices. Try refreshing.");
            }
        } catch {
            setLoadError("We couldn't load your invoices. Try refreshing.");
        } finally {
            setLoadingInvoices(false);
        }
    }

    useEffect(() => {
        if (organisation) loadInvoices();
    }, [organisation]);

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-navy">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
            </div>
        );
    }

    if (!authed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-navy px-4">
                <div className="max-w-sm w-full border border-cream/10 rounded-lg bg-cream/5 p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-cream">JetLybooks</h1>
                        <p className="text-cream/50 text-sm mt-1">
                            Sign in with your JetDomains account — free, no separate signup.
                        </p>
                    </div>
                    <button
                        onClick={() => signIn()}
                        className="w-full h-11 bg-gold text-navy font-medium rounded-lg hover:opacity-90 transition"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy px-4 py-8 sm:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-cream/40 text-xs">{user?.profile?.email} · {organisation?.company_name}</p>
                    <button onClick={() => signOut()} className="text-cream/40 text-xs hover:text-cream">
                        Sign out
                    </button>
                </div>

                {view === "list" && (
                    <InvoiceList
                        invoices={invoices}
                        loading={loadingInvoices}
                        error={loadError}
                        onNewInvoice={() => setView("new-invoice")}
                    />
                )}

                {view === "new-invoice" && (
                    <NewInvoiceForm
                        organisationId={organisation.id}
                        userId={user.profile.sub}
                        onBack={() => setView("list")}
                        onCreated={() => {
                            setView("list");
                            loadInvoices();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
