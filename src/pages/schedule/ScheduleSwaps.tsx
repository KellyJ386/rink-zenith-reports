import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowRightLeft, Clock, CheckCircle, XCircle, Ban } from "lucide-react";
import { format } from "date-fns";
import { useShiftSwaps } from "@/hooks/useShiftSwaps";
import { ShiftSwapApprovalDialog } from "@/components/schedule/ShiftSwapApprovalDialog";

const ScheduleSwaps = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSwap, setSelectedSwap] = useState<any>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  const { swaps, isLoading, approveSwapRequest, cancelSwapRequest, isSubmitting } = useShiftSwaps();

  const filteredSwaps = useMemo(() => {
    return swaps.filter((swap: any) => {
      const matchesSearch = 
        swap.requester?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        swap.recipient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || swap.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [swaps, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: swaps.length,
      pending: swaps.filter((s: any) => s.status === 'pending').length,
      approved: swaps.filter((s: any) => s.status === 'approved').length,
      denied: swaps.filter((s: any) => s.status === 'denied').length,
    };
  }, [swaps]);

  const handleReviewSwap = (swap: any) => {
    setSelectedSwap(swap);
    setIsApprovalDialogOpen(true);
  };

  const handleApprove = (data: any) => {
    if (selectedSwap) {
      approveSwapRequest.mutate({ id: selectedSwap.id, data });
    }
  };

  const handleDeny = (data: any) => {
    if (selectedSwap) {
      approveSwapRequest.mutate({ id: selectedSwap.id, data });
    }
  };

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this swap request?")) {
      cancelSwapRequest.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><Ban className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Shift Swap Requests</h2>
        <p className="text-muted-foreground">Manage staff shift swap requests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Denied</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.denied}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Swap Requests</CardTitle>
          <CardDescription>Review and approve shift swaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by staff name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading swap requests...</div>
          ) : filteredSwaps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No swap requests found</p>
              <p className="text-sm">Staff can request swaps from the calendar view</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Role/Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSwaps.map((swap: any) => (
                    <TableRow key={swap.id}>
                      <TableCell className="font-medium">
                        {format(new Date(swap.shift.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTime(swap.shift.start_time)} - {formatTime(swap.shift.end_time)}
                      </TableCell>
                      <TableCell>{swap.requester?.full_name}</TableCell>
                      <TableCell>{swap.recipient?.full_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{swap.shift.role?.name}</div>
                          <div className="text-muted-foreground">{swap.shift.area}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(swap.status)}</TableCell>
                      <TableCell>{format(new Date(swap.created_at), 'MMM d')}</TableCell>
                      <TableCell className="text-right">
                        {swap.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReviewSwap(swap)}
                            >
                              Review
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(swap.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {swap.status !== 'pending' && swap.manager_notes && (
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {swap.manager_notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ShiftSwapApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => {
          setIsApprovalDialogOpen(false);
          setSelectedSwap(null);
        }}
        onApprove={handleApprove}
        onDeny={handleDeny}
        swap={selectedSwap}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ScheduleSwaps;
