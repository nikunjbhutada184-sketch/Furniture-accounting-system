"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoicePaymentModal } from "./invoice-payment-modal";
import type { JournalOption } from "./invoice-payment-modal";
import { InvoiceStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

export interface InvoiceDetail {
  id: string;
  number: string;
  reference: string | null;
  customerName: string;
  invoiceDate: Date;
  dueDate: Date | null;
  status: InvoiceStatus;
  amountTotal: number;
  amountResidual: number;
  lines: {
    id: string;
    productName: string | null;
    accountName: string;
    analyticAccountName: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  payments: {
    amount: number;
    methodName: string;
  }[];
}

export function InvoiceView({
  invoice,
  journals,
}: {
  invoice: InvoiceDetail;
  journals: JournalOption[];
}) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const router = useRouter();

  const getStatusBadge = () => {
    switch (invoice.status) {
      case InvoiceStatus.PAID:
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case InvoiceStatus.PARTIALLY_PAID:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Partial</Badge>;
      default:
        return <Badge variant="secondary">Not Paid</Badge>;
    }
  };

  const cashPayments = invoice.payments.filter((p) => p.methodName.toLowerCase().includes("cash")).reduce((sum, p) => sum + p.amount, 0);
  const bankPayments = invoice.payments.filter((p) => p.methodName.toLowerCase().includes("bank")).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center gap-2 bg-card p-3 rounded-lg border shadow-sm overflow-x-auto">
        <Button variant="outline" size="sm">New</Button>
        <Button variant="default" size="sm">Confirm</Button>
        <Button
          variant="default"
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          disabled={invoice.amountResidual <= 0}
          onClick={() => setIsPaymentModalOpen(true)}
        >
          Pay
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm">SO</Button>
        <Button variant="outline" size="sm">Budget</Button>
        <Button variant="outline" size="sm">Cancel</Button>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
      </div>

      {/* Invoice Details */}
      <div className="bg-card border rounded-lg shadow-sm p-6 space-y-8">
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Customer Invoice No.</span>
              <span className="font-semibold">{invoice.number}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Customer Name</span>
              <span className="font-semibold">{invoice.customerName}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Status</span>
              <span>{getStatusBadge()}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Invoice Reference</span>
              <span className="font-semibold">{invoice.reference || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Invoice Date</span>
              <span className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-semibold">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Lines Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">Sr. No.</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Chart of Accounts</TableHead>
                <TableHead>Budget Analytics</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line, idx) => (
                <TableRow key={line.id}>
                  <TableCell className="text-center text-muted-foreground">{idx + 1}.</TableCell>
                  <TableCell>{line.productName || "Unknown Product"}</TableCell>
                  <TableCell className="text-green-600">{line.accountName}</TableCell>
                  <TableCell>{line.analyticAccountName || "N/A"}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{line.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{line.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {invoice.lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No lines found on this invoice.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="flex justify-end pt-4">
          <div className="w-64 space-y-2">
            <div className="flex justify-between font-semibold border-b pb-2">
              <span>Total</span>
              <span>{invoice.amountTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Paid Via Cash</span>
              <span>{cashPayments.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground border-b pb-2">
              <span>Paid Via Bank</span>
              <span>{bankPayments.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Amount Due</span>
              <span className={invoice.amountResidual > 0 ? "text-destructive" : "text-green-600"}>
                {invoice.amountResidual.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <InvoicePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoice.id}
        partnerName={invoice.customerName}
        amountDue={invoice.amountResidual}
        journals={journals}
      />
    </div>
  );
}
