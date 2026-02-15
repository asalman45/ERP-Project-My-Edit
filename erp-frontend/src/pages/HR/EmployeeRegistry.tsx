import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Briefcase, Building2, Calendar, Phone, Mail, Search, MoreVertical, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const EmployeeRegistry: React.FC = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/hr/employees");
            const data = await resp.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch workforce data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workforce Registry</h1>
                    <p className="text-muted-foreground">Managing employee lifecycle and organizational structure</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100">
                    <Plus className="w-4 h-4" /> Onboard New Employee
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Total Strength</span>
                        </div>
                        <div className="text-3xl font-bold">{employees.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active full-time employees</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                            <Building2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Departments</span>
                        </div>
                        <div className="text-3xl font-bold">
                            {new Set(employees.map(e => e.department)).size}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cross-functional business units</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Employee Master List</CardTitle>
                            <CardDescription>Comprehensive database of your domestic and international workforce</CardDescription>
                        </div>
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input className="pl-10 h-10 border-slate-200 focus:ring-indigo-500 rounded-xl" placeholder="Search by name, code or dept..." />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-bold">Employee</TableHead>
                                <TableHead className="font-bold">Role & Dept</TableHead>
                                <TableHead className="font-bold">Contact</TableHead>
                                <TableHead className="font-bold">Joining Date</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((emp) => (
                                <TableRow key={emp.emp_id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-indigo-100">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 leading-none">{emp.first_name} {emp.last_name}</div>
                                                <div className="text-xs font-mono text-indigo-600 mt-1">{emp.emp_code}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {emp.designation}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" /> {emp.department}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 cursor-pointer">
                                                <Mail className="w-3 h-3" /> {emp.email || "N/A"}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                <Phone className="w-3 h-3" /> {emp.phone || "N/A"}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(emp.doj).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-slate-50 text-slate-700'}>
                                            {emp.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {employees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-24 text-slate-300">
                                        <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-5" />
                                        <p className="font-medium text-slate-400">Your workforce registry is currently empty.</p>
                                        <Button variant="link" className="text-indigo-600 mt-2">Add your first employee</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmployeeRegistry;
