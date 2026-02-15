import React, { useState } from "react";
import { CheckCircle, Circle, Clock, ArrowRight, Package, Users, FileText, Award, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MaterialIssueModal } from "@/components/modals/MaterialIssueModal";
import { JobStep, WorkOrder, WorkOrderStep } from "@/types";

interface WorkOrderStepperProps {
  workOrder: WorkOrder;
  steps: WorkOrderStep[];
  onStepComplete: (stepId: string, remarks?: string) => void;
}

const stepConfig = {
  CUTTING: { icon: Package, label: "Cutting", color: "bg-blue-500" },
  WELDING: { icon: Users, label: "Welding", color: "bg-orange-500" },
  ASSEMBLY: { icon: FileText, label: "Assembly", color: "bg-purple-500" },
  QA: { icon: Award, label: "Quality Assurance", color: "bg-green-500" },
  FINISHED_GOODS: { icon: Truck, label: "Finished Goods", color: "bg-gray-500" },
};

export const WorkOrderStepper: React.FC<WorkOrderStepperProps> = ({
  workOrder,
  steps,
  onStepComplete,
}) => {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const { toast } = useToast();

  const handleCompleteStep = (stepId: string) => {
    onStepComplete(stepId, remarks);
    setActiveStep(null);
    setRemarks("");
    
    toast({
      title: "Step Completed",
      description: "Work order step has been marked as completed",
    });
  };

  const getStepStatus = (step: WorkOrderStep) => {
    if (step.status === "COMPLETED") return "completed";
    if (step.status === "IN_PROGRESS") return "active";
    return "pending";
  };

  return (
    <div className="space-y-6">
      <div className="card-enterprise p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Work Order Progress</h3>
          <Badge variant="outline" className="text-sm">
            {workOrder.progress}% Complete
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${workOrder.progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const config = stepConfig[step.step];
          const Icon = config.icon;
          const status = getStepStatus(step);
          const isActive = activeStep === step.id;

          return (
            <Card key={step.id} className={`transition-all duration-200 ${
              status === "completed" ? "border-emerald-500 bg-emerald-50/50" :
              status === "active" ? "border-primary bg-primary/5" :
              "border-muted"
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      status === "completed" ? "bg-emerald-500 text-white" :
                      status === "active" ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {status === "completed" ? (
                        <CheckCircle size={20} />
                      ) : status === "active" ? (
                        <Clock size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{config.label}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {status === "completed" ? "Completed" : 
                         status === "active" ? "In Progress" : "Pending"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {step.requiredMaterials.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMaterialModal(true)}
                        disabled={status === "completed"}
                      >
                        Issue Materials ({step.requiredMaterials.length})
                      </Button>
                    )}
                    
                    {status === "active" && !isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStep(step.id)}
                      >
                        Complete Step
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {step.requiredMaterials.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium mb-2">Required Materials:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {step.requiredMaterials.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <span className="text-sm">{material.componentName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {material.quantity} {material.uomCode}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isActive && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Completion Remarks:</label>
                      <Textarea
                        placeholder="Add remarks about the completed step..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCompleteStep(step.id)}
                        size="sm"
                        className="flex-1"
                      >
                        Mark as Complete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveStep(null)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {step.status === "COMPLETED" && step.remarks && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-800">
                      <strong>Remarks:</strong> {step.remarks}
                    </p>
                    {step.completedBy && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Completed by {step.completedBy} on {step.endTime}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showMaterialModal && (
        <MaterialIssueModal
          isOpen={showMaterialModal}
          onClose={() => setShowMaterialModal(false)}
        />
      )}
    </div>
  );
};