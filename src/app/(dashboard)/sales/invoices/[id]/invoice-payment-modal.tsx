"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { payCustomerInvoice } from "@/server/actions/invoice-payment";
import { useRouter } from "next/navigation";

export interface JournalOption {
  id: string;
  name: string;
}

export function InvoicePaymentModal({
  isOpen,
  onClose,
  invoiceId,
  partnerName,
  amountDue,
  journals,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  partnerName: string;
  amountDue: number;
  journals: JournalOption[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("invoiceId", invoiceId);

    const res = await payCustomerInvoice(formData);

    if (res.success) {
      setLoading(false);
      onClose();
      router.refresh();
    } else {
      setLoading(false);
      alert("Failed to process payment. " + ("form" in (res.errors || {}) ? (res.errors as Record<string, string[]>).form?.[0] : ""));
    }
  };

  const defaultDate = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoice Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup defaultValue="receive" className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="send" id="send" disabled />
                  <Label htmlFor="send" className="text-muted-foreground">Send</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="receive" id="receive" />
                  <Label htmlFor="receive">Receive</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="paymentDate">Date</Label>
              <Input id="paymentDate" name="paymentDate" type="date" defaultValue={defaultDate} required />
            </div>

            <div className="space-y-3">
              <Label>Partner</Label>
              <Input value={partnerName} readOnly className="bg-muted" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="journalId">Payment Via</Label>
              <Select name="journalId" defaultValue={journals[0]?.id} required>
                <SelectTrigger id="journalId">
                  <SelectValue placeholder="Select Bank/Cash" />
                </SelectTrigger>
                <SelectContent>
                  {journals.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 col-span-2 sm:col-span-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={amountDue}
                required
                max={amountDue}
              />
            </div>
            
            <div className="space-y-3 col-span-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" name="notes" placeholder="Alpha Numeric (Text)" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
