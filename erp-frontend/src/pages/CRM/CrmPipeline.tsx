import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, Filter, Search, TrendingUp, DollarSign, Target, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const stages = ["DISCOVERY", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"];

const CrmPipeline: React.FC = () => {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            setLoading(true);
            const resp = await fetch("/api/crm/opportunities");
            const data = await resp.json();
            if (data.success) {
                setOpportunities(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch opportunities");
        } finally {
            setLoading(false);
        }
    };

    const updateStage = async (oppId: string, stage: string) => {
        try {
            const resp = await fetch(`/api/crm/opportunities/${oppId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stage })
            });
            if (resp.ok) {
                toast.info(`Moved to ${stage}`);
                fetchOpportunities();
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Sales Pipeline</h1>
                    <p className="text-muted-foreground">Manage and forecast your deal flow</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </Button>
                    <Button className="bg-indigo-600 gap-2">
                        <Plus className="w-4 h-4" /> New Opportunity
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-blue-600 uppercase mb-1">Total Pipeline Value</div>
                        <div className="text-2xl font-bold text-blue-900">
                            ₹{opportunities.reduce((sum, o) => sum + parseFloat(o.deal_value), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Won Deals (MTD)</div>
                        <div className="text-2xl font-bold text-emerald-900">
                            ₹{opportunities.filter(o => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + parseFloat(o.deal_value), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardContent className="pt-6">
                        <div className="text-xs font-bold text-indigo-600 uppercase mb-1">Forecast Probability</div>
                        <div className="text-2xl font-bold text-indigo-900">
                            {Math.round(opportunities.reduce((sum, o) => sum + (parseFloat(o.deal_value) * (o.probability / 100)), 0) / opportunities.length || 0).toLocaleString()}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[600px]">
                {stages.map((stage) => (
                    <div key={stage} className="min-w-[300px] flex-shrink-0 space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                {stage.replace("_", " ")}
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-1.5 py-0">
                                    {opportunities.filter(o => o.stage === stage).length}
                                </Badge>
                            </h3>
                            <div className="text-xs font-bold text-slate-400">
                                ₹{opportunities.filter(o => o.stage === stage).reduce((sum, o) => sum + parseFloat(o.deal_value), 0).toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {opportunities.filter((o) => o.stage === stage).map((opp) => (
                                <Card
                                    key={opp.opp_id}
                                    className="cursor-move hover:shadow-md transition-shadow border-l-4 border-l-indigo-400"
                                    onClick={() => {/* Open Detail Dialog */ }}
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="font-bold text-slate-800 leading-tight truncate">{opp.title}</div>
                                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none px-1 text-[10px]">
                                                {opp.probability}%
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> {opp.lead?.company || opp.customer?.name || "Private Account"}
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t mt-2">
                                            <div className="text-lg font-bold text-indigo-700">₹{parseFloat(opp.deal_value).toLocaleString()}</div>
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold">SA</div>
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">+</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {stages.indexOf(stage) < stages.length - 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-[10px] text-slate-500 hover:text-indigo-600 w-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateStage(opp.opp_id, stages[stages.indexOf(stage) + 1]);
                                                    }}
                                                >
                                                    Next Stage →
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {opportunities.filter((o) => o.stage === stage).length === 0 && (
                                <div className="border-2 border-dashed border-slate-100 rounded-xl h-24 flex items-center justify-center text-slate-300">
                                    <span className="text-xs">No deals here</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CrmPipeline;
