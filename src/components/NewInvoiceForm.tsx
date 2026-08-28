import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "../lib/api";

type Item = { description: string; quantity: number; unit_price: string };

export default function NewInvoiceForm({ organisationId, userId, onBack, onCreated }: {
    organisationId: string;
    userId: string;
    onBack: () => void;
    onCreated: () => void;
}) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("new");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unit_price: "" }]);
    const [saving, setSaving] = useState(false);

    const subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.unit_price) || 0;
        return sum + price * (item.quantity || 1) * 100; // rand -> cents
    }, 0);

    useEffect(() => {
        async function loadCustomers() {
            setLoadingCustomers(true);
            try {
                const result = await apiGet("jetlybooks/get_customers.php", { organisation_id: organisationId });
                if (result.success) setCustomers(result.customers ?? []);
            } catch {
                // Non-fatal — form still works with "new customer" only
            } finally {
                setLoadingCustomers(false);
            }
        }
        loadCustomers();
    }, [organisationId]);

    function updateItem(index: number, field: keyof Item, value: string | number) {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }

    function addItem() {
        setItems(prev => [...prev, { description: "", quantity: 1, unit_price: "" }]);
    }

    function removeItem(index: number) {
        setItems(prev => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit() {
        if (selectedCustomerId === "new" && !customerName.trim()) {
            toast.error("Customer name is required");
            return;
        }
        if (items.some(i => !i.description.trim() || !i.unit_price)) {
            toast.error("Every line item needs a description and price");
            return;
        }

        setSaving(true);
        try {
            const result = await apiPost("jetlybooks/create_invoice.php", {
                organisation_id: organisationId,
                user_id: userId,
                ...(selectedCustomerId === "new"
                    ? { customer: { name: customerName, email: customerEmail || null } }
                    : { customer_id: selectedCustomerId }),
                due_date: dueDate || null,
                notes: notes || null,
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: Math.round(parseFloat(i.unit_price) * 100),
                })),
            });

            if (!result.success) throw new Error(result.error ?? "Failed to create invoice");

            toast.success(`Invoice ${result.invoice_number} created`);
            onCreated();
        } catch (err: any) {
            toast.error("Couldn't create invoice", { description: err.message });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-cream/60 hover:text-cream text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to invoices
            </button>

            <h1 className="text-2xl font-display font-bold text-cream">New Invoice</h1>

            <div className="border border-cream/10 rounded-lg p-5 bg-cream/5 space-y-4">
                <h2 className="text-cream font-medium text-sm">Customer</h2>

                {loadingCustomers ? (
                    <div className="flex items-center gap-2 text-cream/40 text-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading customers...
                    </div>
                ) : (
                    <select
                        value={selectedCustomerId}
                        onChange={e => setSelectedCustomerId(e.target.value)}
                        className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm w-full"
                    >
                        <option value="new">+ New customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}{c.email ? ` (${c.email})` : ""}</option>
                        ))}
                    </select>
                )}

                {selectedCustomerId === "new" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                        <input
                            placeholder="Customer name"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream placeholder:text-cream/30 text-sm"
                        />
                        <input
                            placeholder="Email (optional)"
                            value={customerEmail}
                            onChange={e => setCustomerEmail(e.target.value)}
                            className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream placeholder:text-cream/30 text-sm"
                        />
                    </div>
                )}
            </div>

            <div className="border border-cream/10 rounded-lg p-5 bg-cream/5 space-y-4">
                <h2 className="text-cream font-medium text-sm">Line Items</h2>
                {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                        <input
                            placeholder="Description"
                            value={item.description}
                            onChange={e => updateItem(i, "description", e.target.value)}
                            className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream placeholder:text-cream/30 text-sm"
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
                            placeholder="R0.00"
                            value={item.unit_price}
                            onChange={e => updateItem(i, "unit_price", e.target.value)}
                            className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream placeholder:text-cream/30 text-sm"
                        />
                        <button
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                            className="text-cream/30 hover:text-destructive disabled:opacity-20"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button onClick={addItem} className="flex items-center gap-1.5 text-gold text-sm hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add item
                </button>

                <div className="border-t border-cream/10 pt-3 flex justify-between">
                    <span className="text-cream/70 text-sm">Subtotal</span>
                    <span className="text-cream font-semibold">R{(subtotal / 100).toFixed(2)}</span>
                </div>
            </div>

            <div className="border border-cream/10 rounded-lg p-5 bg-cream/5 space-y-4">
                <h2 className="text-cream font-medium text-sm">Details</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-cream/50 text-xs mb-1 block">Due date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm w-full"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-cream/50 text-xs mb-1 block">Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        className="bg-navy border border-cream/10 rounded-md px-3 py-2 text-cream text-sm w-full"
                    />
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full h-11 bg-gold text-navy font-medium rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Invoice"}
            </button>
        </div>
    );
}
