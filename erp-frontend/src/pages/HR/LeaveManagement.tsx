import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Check, X, Clock } from "lucide-react";

const LeaveManagement: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'hr';

  const [newLeave, setNewLeave] = useState({
    emp_id: '',
    leave_type: 'CASUAL',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/leave/requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (e) {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const submitLeave = async () => {
    if (!newLeave.emp_id || !newLeave.start_date || !newLeave.end_date) {
      return toast.error("Please fill required fields");
    }
    try {
      const res = await fetch("/api/hr/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeave)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leave requested successfully");
        fetchRequests();
        setNewLeave({ emp_id: '', leave_type: 'CASUAL', start_date: '', end_date: '', reason: '' });
      } else {
        toast.error(data.error || "Failed to submit request");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/hr/leave/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Leave ${status.toLowerCase()}`);
        fetchRequests();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Network error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Manage employee time off requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Apply for Leave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Employee ID (UUID)</Label>
              <Input 
                value={newLeave.emp_id} 
                onChange={e => setNewLeave({...newLeave, emp_id: e.target.value})} 
                placeholder="Enter Employee UUID"
              />
            </div>
            <div>
              <Label>Leave Type</Label>
              <Select value={newLeave.leave_type} onValueChange={v => setNewLeave({...newLeave, leave_type: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASUAL">Casual Leave</SelectItem>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="EARNED">Earned Leave</SelectItem>
                  <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={newLeave.start_date} onChange={e => setNewLeave({...newLeave, start_date: e.target.value})} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={newLeave.end_date} onChange={e => setNewLeave({...newLeave, end_date: e.target.value})} />
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} placeholder="Optional reason" />
            </div>
            <Button onClick={submitLeave} className="w-full bg-indigo-600 hover:bg-indigo-700">Submit Request</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.leave_id}>
                    <TableCell>
                      <div className="font-semibold">{req.employee?.first_name} {req.employee?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{req.employee?.emp_code}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{req.leave_type}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(req.status)} variant="outline">{req.status}</Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right space-x-2">
                        {req.status === 'PENDING' && (
                          <>
                            <Button size="icon" variant="ghost" className="text-emerald-600" onClick={() => updateStatus(req.leave_id, 'APPROVED')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-600" onClick={() => updateStatus(req.leave_id, 'REJECTED')}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {requests.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">No requests found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveManagement;
