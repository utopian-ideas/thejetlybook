import { FileText, Loader2, Plus } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
    paid: "bg-emerald-500/20 text-emerald-400",
    sent: "bg-blue-500/20 text-blue-300",
    draft: "bg-cream/10 text-cream/50",
    overdue: "bg-destructive/20 text-destructive",
};

function formatRand(cents: number) {
    return `R${(cents / 100).toFixed(2)}`;
}

export default function InvoiceList({ invoices, loading, error, onNewInvoice }: {
    invoices: any[];
    loading: boolean;
    error: string | null;
    onNewInvoice: () => void;
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-display font-bold text-cream">Invoices</h1>
                <button
                    onClick={onNewInvoice}
                    className="flex items-center gap-2 bg-gold text-navy font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
                >
                    <Plus className="w-4 h-4" /> New Invoice
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-5 h-5 text-gold animate-spin" />
                </div>
            ) : error ? (
                <div className="border border-cream/10 rounded-lg p-8 text-center bg-cream/5">
                    <p className="text-cream/60 text-sm">{error}</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="border border-cream/10 rounded-lg p-12 text-center bg-cream/5">
                    <FileText className="w-10 h-10 text-cream/20 mx-auto mb-4" />
                    <p className="text-cream font-medium">No invoices yet</p>
                    <p className="text-cream/50 text-sm mt-1">Create your first invoice to get started.</p>
                </div>
            ) : (
                <ul className="grid gap-2">
                    {invoices.map((invoice) => (
                        <li
                            key={invoice.id}
                            className="border border-cream/10 rounded-lg p-4 bg-cream/5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-cream font-medium">{invoice.customer_name}</p>
                                    <p className="text-cream/40 text-xs mt-0.5">
                                        #{invoice.invoice_number} · Due {invoice.due_date ?? "—"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gold font-semibold">{formatRand(invoice.total)}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status] ?? STATUS_STYLES.draft}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}