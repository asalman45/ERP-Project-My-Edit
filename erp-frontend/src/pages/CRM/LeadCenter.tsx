import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Mail, Globe, Clock, MoreVertical, Search, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const LeadCenter: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/crm/leads");
            const data = await resp.json();
            if (data.success) {
                setLeads(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Inbound Leads</h1>
                    <p className="text-muted-foreground">Prospect management and qualification center</p>
                </div>
                <Button className="bg-indigo-600 gap-2" onClick={() => setIsNewLeadOpen(true)}>
                    <Plus className="w-4 h-4" /> New Inbound Lead
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> Fresh Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leads.filter(l => l.status === 'NEW').length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Master Prospect Registry</CardTitle>
                            <CardDescription>Consolidated view of all incoming trade inquiries</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input className="pl-9" placeholder="Search prospects..." />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contact / Company</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Engagement</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((lead) => (
                                <TableRow key={lead.lead_id} className="group">
                                    <TableCell>
                                        <div className="font-bold text-indigo-900 leading-tight">{lead.contact_name}</div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{lead.company}</div>
                                        <div className="flex gap-3 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <Mail className="w-3 h-3 cursor-pointer hover:text-indigo-600" />
                                            <Phone className="w-3 h-3 cursor-pointer hover:text-indigo-600" />
                                            <Globe className="w-3 h-3 cursor-pointer hover:text-indigo-600" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 border-slate-200">
                                            {lead.source || "Direct"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={lead.status === 'NEW' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-emerald-100 text-emerald-700'}>
                                            {lead.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                            <Clock className="w-3 h-3" /> {lead._count?.activities || 0} Interactions
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground italic">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" className="text-indigo-600">
                                            Qualify Prospect
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {leads.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-slate-300">
                                        <User className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                        <p className="font-medium">No inbound leads found yet.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Mini Activity Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Qualification Criteria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <CheckCircle2 className="text-indigo-600 w-5 h-5 flex-shrink-0" />
                            <p className="text-xs text-indigo-800 leading-normal">
                                <b>Lead Scoring:</b> Fresh prospects are scored based on company size and source type.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LeadCenter;
