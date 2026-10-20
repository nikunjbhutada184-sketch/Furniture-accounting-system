"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List as ListIcon, ChevronLeft } from "lucide-react";
import { BudgetPieChart } from "./budget-pie-chart";

export interface BudgetReportItem {
  id: string;
  name: string;
  periodStart: Date;
  periodEnd: Date;
  status: BudgetStatus;
  achievedAmount: number;
  plannedAmount: number;
}

export function BudgetReportView({ budgets }: { budgets: BudgetReportItem[] }) {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredBudgets = budgets.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <Button variant="outline">New</Button>
          <div className="max-w-sm w-full mx-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/50 ml-4">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => setView("list")}
          >
            <ListIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="icon"
            className="w-8 h-8"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content View */}
      {view === "list" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Pie Chart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((budget) => {
                const balance = Math.max(0, budget.plannedAmount - budget.achievedAmount);
                return (
                  <TableRow
                    key={budget.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/reports/budget/${budget.id}`)}
                  >
                    <TableCell className="font-medium">{budget.name}</TableCell>
                    <TableCell>{new Date(budget.periodStart).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(budget.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={budget.status === "CONFIRMED" ? "default" : "secondary"}>
                        {budget.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <BudgetPieChart achieved={budget.achievedAmount} balance={balance} size={32} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredBudgets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No budgets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBudgets.map((budget) => {
            const balance = Math.max(0, budget.plannedAmount - budget.achievedAmount);
            return (
              <Card
                key={budget.id}
                className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                onClick={() => router.push(`/reports/budget/${budget.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base line-clamp-1">{budget.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {new Date(budget.periodStart).toLocaleDateString()} -{" "}
                        {new Date(budget.periodEnd).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={budget.status === "CONFIRMED" ? "default" : "secondary"}>
                      {budget.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  <BudgetPieChart achieved={budget.achievedAmount} balance={balance} size={120} />
                  <div className="flex w-full justify-between mt-4 text-sm px-2">
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground text-xs">Achieved</span>
                      <span className="font-semibold text-chart-1">{budget.achievedAmount}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground text-xs">Balance</span>
                      <span className="font-semibold text-chart-2">{balance}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredBudgets.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              No budgets found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
