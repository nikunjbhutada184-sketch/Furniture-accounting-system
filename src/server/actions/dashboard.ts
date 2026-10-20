import { prisma } from "@/server/db/prisma";
import { SalesOrderStatus, PurchaseOrderStatus } from "@prisma/client";

export async function getDashboardMetrics() {
  const [salesAll, salesConfirmed, salesDraft] = await Promise.all([
    prisma.salesOrder.count(),
    prisma.salesOrder.count({ where: { status: SalesOrderStatus.CONFIRMED } }),
    prisma.salesOrder.count({ where: { status: SalesOrderStatus.DRAFT } }),
  ]);

  const [purchaseAll, purchaseConfirmed, purchaseDraft] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: PurchaseOrderStatus.CONFIRMED } }),
    prisma.purchaseOrder.count({ where: { status: PurchaseOrderStatus.DRAFT } }),
  ]);

  const budgetLines = await prisma.budgetLine.aggregate({
    _sum: {
      plannedAmount: true,
      committedAmount: true,
      achievedAmount: true,
    },
  });

  const budgetAchieved = budgetLines._sum.achievedAmount?.toNumber() ?? 0;
  const budgetPlanned = budgetLines._sum.plannedAmount?.toNumber() ?? 0;
  const budgetCommitted = budgetLines._sum.committedAmount?.toNumber() ?? 0;

  return {
    sales: { all: salesAll, confirmed: salesConfirmed, draft: salesDraft },
    purchase: { all: purchaseAll, confirmed: purchaseConfirmed, draft: purchaseDraft },
    budget: { achieved: budgetAchieved, planned: budgetPlanned, committed: budgetCommitted },
  };
}
