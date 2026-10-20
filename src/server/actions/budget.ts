import { prisma } from "@/server/db/prisma";

export async function getBudgetsWithLines() {
  const budgets = await prisma.budget.findMany({
    include: {
      lines: true,
    },
    orderBy: {
      periodStart: "desc",
    },
  });

  return budgets.map((budget) => {
    let achievedAmount = 0;
    let plannedAmount = 0;

    for (const line of budget.lines) {
      achievedAmount += line.achievedAmount.toNumber();
      plannedAmount += line.plannedAmount.toNumber();
    }

    return {
      id: budget.id,
      name: budget.name,
      periodStart: budget.periodStart,
      periodEnd: budget.periodEnd,
      status: budget.status,
      achievedAmount,
      plannedAmount,
    };
  });
}
