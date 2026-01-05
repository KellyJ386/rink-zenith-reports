import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, TrendingUp, Users, Clock, BarChart3, FileText, DollarSign, CheckCircle } from "lucide-react";
import { startOfWeek, endOfWeek, format, subWeeks } from "date-fns";
import { useScheduleReports } from "@/hooks/useScheduleReports";
import { ReportExport } from "@/components/schedule/ReportExport";
import { ScheduleReportPDFExport } from "@/components/schedule/ScheduleReportPDFExport";
import { useNavigate } from "react-router-dom";

const ScheduleReports = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(() => startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }));
  const [endDate, setEndDate] = useState(() => endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }));

  const { data, isLoading } = useScheduleReports(startDate, endDate);

  const handleThisWeek = () => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 0 }));
    setEndDate(endOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleLastWeek = () => {
    setStartDate(startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }));
    setEndDate(endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 }));
  };

  const handleLastMonth = () => {
    const now = new Date();
    setStartDate(subWeeks(now, 4));
    setEndDate(now);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Schedule Reports</h2>
          <p className="text-muted-foreground">Analytics and insights for your schedule</p>
        </div>
        {data && (
          <ScheduleReportPDFExport 
            data={data} 
            startDate={startDate} 
            endDate={endDate} 
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Select the reporting period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleThisWeek}>
                This Week
              </Button>
              <Button variant="outline" onClick={handleLastWeek}>
                Last Week
              </Button>
              <Button variant="outline" onClick={handleLastMonth}>
                Last Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading report data...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Shifts</CardDescription>
                <CardTitle className="text-3xl">{data?.summary.totalShifts || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Assigned</CardDescription>
                <CardTitle className="text-3xl text-green-600">{data?.summary.assignedShifts || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Open</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{data?.summary.openShifts || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Hours</CardDescription>
                <CardTitle className="text-3xl">{data?.summary.totalHours || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Coverage</CardDescription>
                <CardTitle className="text-3xl">{data?.summary.averageCoverage || 0}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="shift-summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="shift-summary">
                <FileText className="h-4 w-4 mr-2" />
                Shift Summary
              </TabsTrigger>
              <TabsTrigger value="staff">
                <Users className="h-4 w-4 mr-2" />
                Staff Hours
              </TabsTrigger>
              <TabsTrigger value="coverage">
                <TrendingUp className="h-4 w-4 mr-2" />
                Daily Coverage
              </TabsTrigger>
              <TabsTrigger value="roles">
                <BarChart3 className="h-4 w-4 mr-2" />
                Role Distribution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shift-summary">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Shift Summary Rollup</CardTitle>
                      <CardDescription>Daily reports and financial summary by date</CardDescription>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Reports: <strong>{data?.summary.totalReportsSubmitted || 0}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>Revenue: <strong>{formatCurrency(data?.summary.totalRevenue || 0)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-red-600" />
                        <span>Expenses: <strong>{formatCurrency(data?.summary.totalExpenses || 0)}</strong></span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {data?.shiftSummary && data.shiftSummary.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Shifts</TableHead>
                            <TableHead className="text-right">Reports</TableHead>
                            <TableHead className="text-right">Tab Completion</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Expenses</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.shiftSummary.map((day) => {
                            const net = day.total_revenue - day.total_expenses;
                            return (
                              <TableRow 
                                key={day.date} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/daily-reports?date=${day.date}`)}
                              >
                                <TableCell className="font-medium">
                                  {format(new Date(day.date), 'EEEE, MMM d')}
                                </TableCell>
                                <TableCell className="text-right">{day.shift_count}</TableCell>
                                <TableCell className="text-right">
                                  {day.reports_submitted > 0 ? (
                                    <Badge variant="default" className="bg-green-600">
                                      {day.reports_submitted}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">0</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {day.total_tabs > 0 ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary transition-all"
                                          style={{ width: `${day.completion_percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-muted-foreground w-12">
                                        {day.tabs_completed}/{day.total_tabs}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  {day.total_revenue > 0 ? formatCurrency(day.total_revenue) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-red-600">
                                  {day.total_expenses > 0 ? formatCurrency(day.total_expenses) : '-'}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {day.total_revenue > 0 || day.total_expenses > 0 ? formatCurrency(net) : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No shift summary data for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Staff Hours Report</CardTitle>
                    <CardDescription>Hours worked by each staff member</CardDescription>
                  </div>
                  <ReportExport data={data} startDate={startDate} endDate={endDate} reportType="staff-hours" />
                </CardHeader>
                <CardContent>
                  {data?.staffHours && data.staffHours.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Primary Role</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                            <TableHead className="text-right">Shift Count</TableHead>
                            <TableHead>Areas Worked</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.staffHours.map((staff) => (
                            <TableRow key={staff.staff_id}>
                              <TableCell className="font-medium">{staff.staff_name}</TableCell>
                              <TableCell>{staff.role_name}</TableCell>
                              <TableCell className="text-right">{staff.total_hours.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{staff.shift_count}</TableCell>
                              <TableCell>{staff.areas_worked.join(', ')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No staff hours data for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coverage">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Daily Coverage Report</CardTitle>
                    <CardDescription>Shift coverage by day</CardDescription>
                  </div>
                  <ReportExport data={data} startDate={startDate} endDate={endDate} reportType="coverage" />
                </CardHeader>
                <CardContent>
                  {data?.dailyCoverage && data.dailyCoverage.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total Shifts</TableHead>
                            <TableHead className="text-right">Assigned</TableHead>
                            <TableHead className="text-right">Open</TableHead>
                            <TableHead className="text-right">Coverage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.dailyCoverage.map((day) => (
                            <TableRow key={day.date}>
                              <TableCell className="font-medium">
                                {format(new Date(day.date), 'EEEE, MMM d, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">{day.total_shifts}</TableCell>
                              <TableCell className="text-right text-green-600">{day.assigned_shifts}</TableCell>
                              <TableCell className="text-right text-yellow-600">{day.open_shifts}</TableCell>
                              <TableCell className="text-right">
                                <span className={day.coverage_percentage >= 80 ? 'text-green-600' : day.coverage_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                  {day.coverage_percentage.toFixed(1)}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No coverage data for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Role Distribution Report</CardTitle>
                    <CardDescription>Shifts and hours by role</CardDescription>
                  </div>
                  <ReportExport data={data} startDate={startDate} endDate={endDate} reportType="roles" />
                </CardHeader>
                <CardContent>
                  {data?.roleDistribution && data.roleDistribution.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Shift Count</TableHead>
                            <TableHead className="text-right">Total Hours</TableHead>
                            <TableHead className="text-right">Avg Hours/Shift</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.roleDistribution.map((role) => (
                            <TableRow key={role.role_name}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: role.color }}
                                  />
                                  {role.role_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{role.shift_count}</TableCell>
                              <TableCell className="text-right">{role.total_hours.toFixed(1)}</TableCell>
                              <TableCell className="text-right">
                                {(role.total_hours / role.shift_count).toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No role distribution data for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ScheduleReports;
