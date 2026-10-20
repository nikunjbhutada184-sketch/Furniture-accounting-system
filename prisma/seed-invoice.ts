import { PrismaClient, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test Customer Invoice...");

  // Get or create a Customer
  let customer = await prisma.contact.findFirst({ where: { type: "CUSTOMER" } });
  if (!customer) {
    customer = await prisma.contact.create({
      data: {
        name: "Mr. Rahul",
        type: "CUSTOMER",
      },
    });
  }

  // Get or create a Sales Journal
  let journal = await prisma.journal.findFirst({ where: { type: "SALES" } });
  if (!journal) {
    journal = await prisma.journal.create({
      data: {
        name: "Customer Invoices",
        code: "INV",
        type: "SALES",
      },
    });
  }

  // Get or create an Income Ledger Account
  let account = await prisma.ledgerAccount.findFirst({ where: { type: "INCOME" } });
  if (!account) {
    account = await prisma.ledgerAccount.create({
      data: {
        code: "4000",
        name: "Product Sales",
        type: "INCOME",
      },
    });
  }

  // Create the Invoice
  const invoice = await prisma.customerInvoice.create({
    data: {
      number: "INV/2026/0001",
      reference: "ABC-26-001",
      customerId: customer.id,
      journalId: journal.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      status: InvoiceStatus.POSTED,
      amountUntaxed: 6000,
      amountTotal: 6000,
      amountResidual: 6000,
      lines: {
        create: [
          {
            description: "Table",
            quantity: 3,
            unitPrice: 2000,
            accountId: account.id,
            subtotal: 6000,
            total: 6000,
          },
        ],
      },
    },
  });

  console.log(`Successfully created Customer Invoice!`);
  console.log(`View it at: http://localhost:3000/sales/invoices/${invoice.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
