import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Calendar, CheckCircle, XCircle, Clock, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useScheduleTimeOff, ScheduleTimeOff as TimeOffType } from "@/hooks/useScheduleTimeOff";
import { TimeOffModal } from "@/components/schedule/TimeOffModal";
import { TimeOffApprovalDialog } from "@/components/schedule/TimeOffApprovalDialog";

const ScheduleTimeOff = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TimeOffType | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    timeOff,
    isLoading,
    createTimeOff,
    updateTimeOff,
    approveTimeOff,
    deleteTimeOff,
    isSubmitting,
  } = useScheduleTimeOff();

  const filteredRequests = useMemo(() => {
    return timeOff.filter((request: any) => {
      const matchesSearch = request.staff?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.request_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [timeOff, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: timeOff.length,
      pending: timeOff.filter((r: any) => r.status === 'pending').length,
      approved: timeOff.filter((r: any) => r.status === 'approved').length,
      denied: timeOff.filter((r: any) => r.status === 'denied').length,
    };
  }, [timeOff]);

  const handleCreateRequest = (data: any) => {
    createTimeOff.mutate(data);
  };

  const handleUpdateRequest = (data: any) => {
    if (editingRequest) {
      updateTimeOff.mutate({ id: editingRequest.id, data });
    }
  };

  const handleEditRequest = (request: TimeOffType) => {
    if (request.status === 'pending') {
      setEditingRequest(request);
      setIsModalOpen(true);
    }
  };

  const handleDeleteRequest = (id: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      deleteTimeOff.mutate(id);
    }
  };

  const handleReviewRequest = (request: TimeOffType) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  const handleApprove = (data: any) => {
    if (selectedRequest) {
      approveTimeOff.mutate({ id: selectedRequest.id, data });
    }
  };

  const handleDeny = (data: any) => {
    if (selectedRequest) {
      approveTimeOff.mutate({ id: selectedRequest.id, data });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRequest(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal Day',
      unpaid: 'Unpaid Leave',
      other: 'Other',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Time Off Requests</h2>
          <p className="text-muted-foreground">Submit and manage vacation and leave requests</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
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
          <CardTitle>All Requests</CardTitle>
          <CardDescription>View and manage time off requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by staff name or type..."
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
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No time off requests found</p>
              <p className="text-sm">Create your first request to get started</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.staff?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getRequestTypeLabel(request.request_type)}</TableCell>
                      <TableCell>{format(new Date(request.start_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(request.end_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReviewRequest(request)}
                              >
                                Review
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRequest(request)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRequest(request.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {request.status !== 'pending' && request.manager_response && (
                            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {request.manager_response}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TimeOffModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={editingRequest ? handleUpdateRequest : handleCreateRequest}
        initialData={editingRequest}
        isSubmitting={isSubmitting}
      />

      <TimeOffApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => {
          setIsApprovalDialogOpen(false);
          setSelectedRequest(null);
        }}
        onApprove={handleApprove}
        onDeny={handleDeny}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ScheduleTimeOff;
