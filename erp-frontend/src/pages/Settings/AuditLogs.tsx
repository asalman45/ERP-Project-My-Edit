import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ShieldCheck, Clock, User } from 'lucide-react';

export const AuditLogs: React.FC = () => {
    const [page, setPage] = useState(0);
    const limit = 50;

    const { data, isLoading } = useQuery({
        queryKey: ['auditLogs', page],
        queryFn: async () => {
            const resp = await fetch(`/api/audit?limit=${limit}&offset=${page * limit}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('empclerp_token')}` }
            });
            if (!resp.ok) throw new Error('Failed to fetch audit logs');
            return resp.json();
        }
    });

    const getActionColor = (action: string) => {
        switch (action.toUpperCase()) {
            case 'CREATE': return 'bg-blue-100 text-blue-700';
            case 'UPDATE': return 'bg-amber-100 text-amber-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            case 'APPROVE': return 'bg-emerald-100 text-emerald-700';
            case 'REJECT': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">System Audit Logs</h1>
                    <p className="text-muted-foreground">Immutable trail of critical system actions, approvals, and security events.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Activity Timeline
                    </CardTitle>
                    <CardDescription>
                        Showing recent operations inside the ERP platform. Access strictly logged for compliance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Module (Entity)</TableHead>
                                    <TableHead>Record ID</TableHead>
                                    <TableHead>Payload Signature</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading audit trail...</TableCell>
                                    </TableRow>
                                ) : data?.data?.map((log: any) => (
                                    <TableRow key={log.log_id}>
                                        <TableCell className="font-mono text-xs whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{log.user_id.substring(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`border-none ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-700">{log.entity_type}</TableCell>
                                        <TableCell className="font-mono text-xs text-indigo-600">{log.entity_id}</TableCell>
                                        <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                                            {log.new_values ? JSON.stringify(log.new_values) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && data?.data?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 font-medium text-slate-400">No recent activity logged.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end mt-4 gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="text-sm px-4 py-2 border rounded-md hover:bg-slate-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!data?.data || data.data.length < limit}
                            className="text-sm px-4 py-2 border rounded-md hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditLogs;
