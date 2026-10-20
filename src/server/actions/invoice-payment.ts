"use server";

import { prisma } from "@/server/db/prisma";
import { revalidatePath } from "next/cache";
import { PaymentDirection, PaymentMethod, PaymentStatus, InvoiceStatus } from "@prisma/client";
import { nextNumber, SEQUENCE_CODES } from "@/server/sequence/sequence-service";
import { z } from "zod";

const payInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  journalId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string(),
  notes: z.string().optional(),
});

export async function payCustomerInvoice(formData: FormData) {
  const parsed = payInvoiceSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    journalId: formData.get("journalId"),
    amount: Number(formData.get("amount")),
    paymentDate: formData.get("paymentDate"),
    notes: formData.get("notes")?.toString(),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { invoiceId, journalId, amount, paymentDate, notes } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.customerInvoice.findUnique({
        where: { id: invoiceId },
        select: { id: true, number: true, customerId: true, amountResidual: true },
      });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.amountResidual.toNumber() < amount) throw new Error("Payment exceeds amount due");

      const paymentNumber = await nextNumber(tx, SEQUENCE_CODES.PAYMENT_INBOUND);

      await tx.payment.create({
        data: {
          number: paymentNumber,
          direction: PaymentDirection.INBOUND,
          method: PaymentMethod.BANK,
          status: PaymentStatus.POSTED,
          contactId: invoice.customerId,
          journalId,
          paymentDate: new Date(paymentDate),
          amount,
          amountUnallocated: 0,
          reference: invoice.number,
          notes,
          allocations: {
            create: {
              customerInvoiceId: invoice.id,
              amount,
            },
          },
        },
      });

      const newResidual = invoice.amountResidual.toNumber() - amount;
      const newStatus = newResidual <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: { increment: amount },
          amountResidual: { decrement: amount },
          status: newStatus,
        },
      });
    });

    revalidatePath(`/sales/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, errors: { form: ["An unexpected error occurred."] } };
  }
}
