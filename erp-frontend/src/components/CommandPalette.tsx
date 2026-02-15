import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    FileText,
    Activity,
    CreditCard,
    Settings,
    Search,
    Wrench,
    ShieldCheck,
    TrendingUp,
    Package
} from "lucide-react";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search modules..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Core Modules">
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/inventory/all"))}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Inventory Master</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/sales/orders"))}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Sales Orders</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Advanced Systems">
                    <CommandItem onSelect={() => runCommand(() => navigate("/crm/pipeline"))}>
                        <Activity className="mr-2 h-4 w-4" />
                        <span>CRM Pipeline</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/qc/inspections"))}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Quality Governance</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/assets/maintenance"))}>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Asset Maintenance</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/hr/payroll"))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Payroll Portal</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Executive Insights">
                    <CommandItem onSelect={() => runCommand(() => navigate("/reports/p-and-l"))}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        <span>P&L Statement</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/finance/overview"))}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Finance Overview</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
