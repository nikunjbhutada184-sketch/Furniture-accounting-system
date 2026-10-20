import { prisma } from "@/server/db/prisma";

export async function getInvoiceWithDetails(id: string) {
  const invoice = await prisma.customerInvoice.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
          account: true,
          analyticAccount: true,
        },
      },
      allocations: {
        include: {
          payment: {
            include: {
              journal: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) return null;

  const journals = await prisma.journal.findMany({
    where: { type: { in: ["BANK", "CASH"] } },
    select: { id: true, name: true },
  });

  return { invoice, journals };
}
