import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "../lib/api";
import { jsPDF } from "jspdf";

type Item = { description: string; quantity: number; unit_price: number };

const STATUS_OPTIONS = ["draft", "sent", "paid", "overdue"];

function formatRand(cents: number) {
    return `R${(cents / 100).toFixed(2)}`;
}

export default function InvoiceDetail({ invoiceId, onBack }: {
    invoiceId: string;
    onBack: () => void;
}) {
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [status, setStatus] = useState("draft");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const result = await apiGet("jetlybooks/get_invoice.php", { invoice_id: invoiceId });
            if (result.success) {
                const inv = result.invoice;
                setInvoice(inv);
                setStatus(inv.status);
                setDueDate(inv.due_date ?? "");
                setNotes(inv.notes ?? "");
                setItems(inv.items.map((i: any) => ({
                    description: i.description,
                    quantity: Number(i.quantity),
                    unit_price: Number(i.unit_price),
                })));
            } else {
                toast.error("Couldn't load invoice");
            }
            setLoading(false);
        }
        load();
    }, [invoiceId]);

    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const tax = invoice?.tax ?? 0;
    const total = subtotal + tax;

    function updateItem(index: number, field: keyof Item, value: string | number) {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }

    function addItem() {
        setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
    }

    function removeItem(index: number) {
        setItems(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const result = await apiPost("jetlybooks/update_invoice.php", {
                invoice_id: invoiceId,
                status,
                due_date: dueDate || null,
                notes,
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: Math.round(i.unit_price),
                })),
            });
            if (!result.success) throw new Error(result.error ?? "Failed to save");
            toast.success("Invoice updated");
            setInvoice((prev: any) => ({ ...prev, status, due_date: dueDate, notes, subtotal, total: result.total }));
            setEditing(false);
        } catch (err: any) {
            toast.error("Couldn't save changes", { description: err.message });
        } finally {
            setSaving(false);
        }
    }

    function handleExport() {
        const doc = new jsPDF();
        const marginX = 20;
        let y = 20;

        doc.setFontSize(18);
        doc.text(`Invoice ${invoice.invoice_number}`, marginX, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`Issue date: ${invoice.issue_date}`, marginX, y);
        doc.text(`Due date: ${dueDate || "—"}`, marginX + 90, y);
        y += 10;

        doc.text(`Bill to: ${invoice.customer_name}`, marginX, y);
        y += 5;
        if (invoice.customer_email) {
            doc.text(invoice.customer_email, marginX, y);
            y += 5;
        }
        y += 8;

        doc.setFont(undefined, "bold");
        doc.text("Description", marginX, y);
        doc.text("Qty", marginX + 100, y);
        doc.text("Unit Price", marginX + 125, y);
        doc.text("Total", marginX + 160, y);
        doc.setFont(undefined, "normal");
        y += 6;

        items.forEach(item => {
            doc.text(item.description, marginX, y);
            doc.text(String(item.quantity), marginX + 100, y);
            doc.text(formatRand(item.unit_price), marginX + 125, y);
            doc.text(formatRand(item.unit_price * item.quantity), marginX + 160, y);
            y += 7;
        });

        y += 6;
        doc.line(marginX, y, marginX + 170, y);
        y += 8;
        doc.text(`Subtotal: ${formatRand(subtotal)}`, marginX + 120, y);
        y += 6;
        doc.text(`Tax: ${formatRand(tax)}`, marginX + 120, y);
        y += 6;
        doc.setFont(undefined, "bold");
        doc.text(`Total: ${formatRand(total)}`, marginX + 120, y);

        if (notes) {
            y += 15;
            doc.setFont(undefined, "normal");
            doc.text("Notes:", marginX, y);
            y += 6;
            doc.text(notes, marginX, y, { maxWidth: 170 });
        }

        doc.save(`${invoice.invoice_number}.pdf`);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-cream/60 hover:text-cream text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to invoices
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 text-cream/70 hover:text-cream text-sm border border-cream/10 rounded-md px-3 py-1.5"
                    >
                        <Download className="w-3.5 h-3.5" /> Export PDF
                    </button>
                    {editing ? (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 bg-gold text-navy font-medium text-sm rounded-md px-3 py-1.5 hover:opacity-90"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                        </button>
                    ) : (
                        <button
                            onClick={() => setEditing(true)}
                            className="text-gold text-sm border border-gold/30 rounded-md px-3 py-1.5 hover:bg-gold/10"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <div>
                <h1 className="text-2xl font-display font-bold text-cream">{invoice.invoice_number}</h1>
                <p className="text-cream/50 text-sm mt-1">{invoice.customer_name}{invoice.customer_email ? ` · ${invoice.customer_email}` : ""}</p>
            </div>

            <div className="border border-cream/10 rounded-lg p-5 bg-cream/5 space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-cream/50 text-xs mb-1 block">Status</label>
                        {editing ? (
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm w-full"
                            >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : (
                            <p className="text-cream text-sm capitalize">{invoice.status}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-cream/50 text-xs mb-1 block">Issue date</label>
                        <p className="text-cream text-sm">{invoice.issue_date}</p>
                    </div>
                    <div>
                        <label className="text-cream/50 text-xs mb-1 block">Due date</label>
                        {editing ? (
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm w-full"
                            />
                        ) : (
                            <p className="text-cream text-sm">{invoice.due_date ?? "—"}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="border border-cream/10 rounded-lg p-5 bg-cream/5 space-y-3">
                <h2 className="text-cream font-medium text-sm">Line Items</h2>
                {items.map((item, i) => (
                    editing ? (
                        <div key={i} className="grid grid-cols-[1fr_70px_100px_32px] gap-2 items-center">
                            <input
                                value={item.description}
                                onChange={e => updateItem(i, "description", e.target.value)}
                                className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm"
                            />
                            <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                                className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm"
                            />
                            <input
                                type="number"
                                step="0.01"
                                value={(item.unit_price / 100).toFixed(2)}
                                onChange={e => updateItem(i, "unit_price", Math.round(parseFloat(e.target.value) * 100))}
                                className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm"
                            />
                            <button onClick={() => removeItem(i)} disabled={items.length === 1} className="text-cream/30 hover:text-destructive disabled:opacity-20">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-cream/80">{item.description} × {item.quantity}</span>
                            <span className="text-cream">{formatRand(item.unit_price * item.quantity)}</span>
                        </div>
                    )
                ))}
                {editing && (
                    <button onClick={addItem} className="flex items-center gap-1.5 text-gold text-sm hover:opacity-80">
                        <Plus className="w-3.5 h-3.5" /> Add item
                    </button>
                )}

                <div className="border-t border-cream/10 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-cream/70">
                        <span>Subtotal</span><span>{formatRand(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-cream/70">
                        <span>Tax</span><span>{formatRand(tax)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-cream">
                        <span>Total</span><span className="text-gold">{formatRand(total)}</span>
                    </div>
                </div>
            </div>

            <div className="border border-cream/10 rounded-lg p-5 bg-cream/5">
                <label className="text-cream/50 text-xs mb-1 block">Notes</label>
                {editing ? (
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm w-full"
                    />
                ) : (
                    <p className="text-cream/70 text-sm">{notes || "—"}</p>
                )}
            </div>
        </div>
    );
}
