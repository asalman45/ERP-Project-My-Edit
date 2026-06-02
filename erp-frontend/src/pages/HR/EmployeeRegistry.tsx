import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User, Briefcase, Building2, Calendar, Phone, Mail, Search, X, ShieldCheck, Users, DollarSign } from "lucide-react";
import ImageUpload from "@/components/common/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const DEPARTMENTS = ["Engineering", "Production", "Finance", "HR", "Sales", "Procurement", "IT", "Quality", "Logistics", "Administration"];
const DESIGNATIONS = ["Manager", "Senior Engineer", "Engineer", "Technician", "Accountant", "Sales Executive", "HR Executive", "Team Lead", "Director", "Intern"];

const emptyForm = {
  first_name: "", last_name: "", email: "", phone: "",
  department: "", designation: "", doj: new Date().toISOString().split("T")[0],
  base_salary: "", bank_account: "", pan_no: "", image_url: ""
};

const EmployeeRegistry: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState("");

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/hr/employees");
      const data = await resp.json();
      if (data.success) setEmployees(data.data);
    } catch { toast.error("Failed to fetch workforce data"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.department || !form.designation || !form.doj) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setSaving(true);
      const resp = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, base_salary: parseFloat(form.base_salary) || 0 })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success(`Employee ${form.first_name} ${form.last_name} onboarded successfully!`);
        setShowModal(false);
        setForm({ ...emptyForm });
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to onboard employee");
      }
    } catch { toast.error("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.emp_code} ${e.department}`.toLowerCase().includes(search.toLowerCase())
  );

  const departments = new Set(employees.map(e => e.department)).size;
  const totalSalary = employees.reduce((s, e) => s + parseFloat(e.base_salary || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workforce Registry</h1>
          <p className="text-muted-foreground">Managing employee lifecycle and organizational structure</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" /> Onboard New Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Users className="w-4 h-4" />
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
            <div className="text-3xl font-bold">{departments}</div>
            <p className="text-xs text-muted-foreground mt-1">Cross-functional business units</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-violet-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Monthly Liability</span>
            </div>
            <div className="text-3xl font-bold">Rs. {totalSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total base salary cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Employee Master List</CardTitle>
              <CardDescription>Comprehensive database of your workforce</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-10 h-10 border-slate-200 rounded-xl"
                placeholder="Search by name, code or dept..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
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
                <TableHead className="font-bold text-right">Base Salary</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.emp_id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {emp.image_url ? (
                        <img src={emp.image_url} alt={`${emp.first_name} ${emp.last_name}`} className="w-10 h-10 rounded-full object-cover border border-indigo-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-indigo-100">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                      )}
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
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="w-3 h-3" /> {emp.email || "N/A"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="w-3 h-3" /> {emp.phone || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {emp.doj ? new Date(emp.doj).toLocaleDateString() : "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-800">
                    Rs. {parseFloat(emp.base_salary || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50" : "bg-slate-50 text-slate-700"}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-slate-300">
                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-5" />
                    <p className="font-medium text-slate-400">
                      {search ? "No employees match your search." : "Your workforce registry is currently empty."}
                    </p>
                    {!search && (
                      <Button variant="link" className="text-indigo-600 mt-2" onClick={() => setShowModal(true)}>
                        Add your first employee
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Onboard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Onboard New Employee</h2>
                <p className="text-sm text-muted-foreground mt-1">Fill in the details to register a new team member</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Personal Information
                </h3>
                <div className="flex items-start gap-6">
                  <ImageUpload
                    currentUrl={form.image_url || null}
                    onUpload={(url) => setForm(f => ({ ...f, image_url: url }))}
                    size="lg"
                    initials={`${form.first_name?.[0] || '?'}${form.last_name?.[0] || ''}`}
                  />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-xs font-semibold text-slate-600">First Name *</Label>
                      <Input id="first_name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Muhammad" className="mt-1" required />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-xs font-semibold text-slate-600">Last Name *</Label>
                      <Input id="last_name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Ali" className="mt-1" required />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Email Address</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="m.ali@company.com" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs font-semibold text-slate-600">Phone Number</Label>
                      <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92 300 0000000" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Employment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-xs font-semibold text-slate-600">Department *</Label>
                    <select
                      id="department"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="designation" className="text-xs font-semibold text-slate-600">Designation *</Label>
                    <select
                      id="designation"
                      value={form.designation}
                      onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                      className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Designation</option>
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="doj" className="text-xs font-semibold text-slate-600">Date of Joining *</Label>
                    <Input id="doj" type="date" value={form.doj} onChange={e => setForm(f => ({ ...f, doj: e.target.value }))} className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="base_salary" className="text-xs font-semibold text-slate-600">Base Salary (Rs.)</Label>
                    <Input id="base_salary" type="number" value={form.base_salary} onChange={e => setForm(f => ({ ...f, base_salary: e.target.value }))} placeholder="50000" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Finance Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-500" /> Financial Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_account" className="text-xs font-semibold text-slate-600">Bank Account No.</Label>
                    <Input id="bank_account" value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} placeholder="PK36SCBL0000001123456702" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="pan_no" className="text-xs font-semibold text-slate-600">NIC / CNIC No.</Label>
                    <Input id="pan_no" value={form.pan_no} onChange={e => setForm(f => ({ ...f, pan_no: e.target.value }))} placeholder="42101-1234567-1" className="mt-1" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={saving}>
                  {saving ? <><span className="animate-spin">◌</span> Saving...</> : <><Plus className="w-4 h-4" /> Onboard Employee</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRegistry;
