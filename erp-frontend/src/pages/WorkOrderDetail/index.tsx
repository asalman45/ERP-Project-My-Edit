import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Factory, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  Play,
  Edit,
  Calendar,
  Package,
  Route,
  User,
  Settings,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock data for work order detail
const mockWorkOrderDetail = {
  wo_id: '1',
  wo_number: 'WO-000001',
  part_number: '54410-EDG50',
  part_description: 'TANK S/A AIR',
  customer_name: 'HINOPAK',
  customer_order_number: 'HO-2024-001',
  model: 'FMBJ',
  quantity_ordered: 100,
  quantity_produced: 25,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  start_date: '2024-01-15',
  due_date: '2024-02-15',
  created_at: '2024-01-10',
  recipe_name: 'TANK S/A AIR Production Recipe',
  recipe_version: '1.0',
  total_operations: 7,
  completed_operations: 3,
  in_progress_operations: 1,
  pending_operations: 3,
  operations: [
    {
      wo_operation_id: '1',
      operation_code: 'CUT001',
      operation_name: 'Cutting/Shearing',
      sequence_order: 1,
      status: 'COMPLETED',
      scheduled_start_date: '2024-01-15T08:00:00',
      scheduled_end_date: '2024-01-15T16:00:00',
      actual_start_date: '2024-01-15T08:30:00',
      actual_end_date: '2024-01-15T15:30:00',
      quantity_planned: 100,
      quantity_completed: 100,
      quantity_scrapped: 2,
      assigned_operator: 'John Smith',
      work_center: 'WC001',
      machine_used: 'M001',
      quality_status: 'PASSED',
      notes: 'Completed successfully with minor scrap'
    },
    {
      wo_operation_id: '2',
      operation_code: 'FORM001',
      operation_name: 'Forming/Bending',
      sequence_order: 2,
      status: 'COMPLETED',
      scheduled_start_date: '2024-01-16T08:00:00',
      scheduled_end_date: '2024-01-17T16:00:00',
      actual_start_date: '2024-01-16T08:00:00',
      actual_end_date: '2024-01-17T14:00:00',
      quantity_planned: 100,
      quantity_completed: 98,
      quantity_scrapped: 0,
      assigned_operator: 'Mike Johnson',
      work_center: 'WC002',
      machine_used: 'M002',
      quality_status: 'PASSED',
      notes: 'Good quality output'
    },
    {
      wo_operation_id: '3',
      operation_code: 'WELD001',
      operation_name: 'Welding - Tacking',
      sequence_order: 3,
      status: 'COMPLETED',
      scheduled_start_date: '2024-01-18T08:00:00',
      scheduled_end_date: '2024-01-19T16:00:00',
      actual_start_date: '2024-01-18T08:30:00',
      actual_end_date: '2024-01-19T12:00:00',
      quantity_planned: 98,
      quantity_completed: 95,
      quantity_scrapped: 3,
      assigned_operator: 'David Brown',
      work_center: 'WC003',
      machine_used: 'M003',
      quality_status: 'PASSED',
      notes: 'Some rework required for quality'
    },
    {
      wo_operation_id: '4',
      operation_code: 'WELD002',
      operation_name: 'Welding - Main Seams',
      sequence_order: 4,
      status: 'IN_PROGRESS',
      scheduled_start_date: '2024-01-20T08:00:00',
      scheduled_end_date: '2024-01-22T16:00:00',
      actual_start_date: '2024-01-20T09:00:00',
      actual_end_date: null,
      quantity_planned: 95,
      quantity_completed: 25,
      quantity_scrapped: 0,
      assigned_operator: 'David Brown',
      work_center: 'WC003',
      machine_used: 'M003',
      quality_status: 'PENDING',
      notes: 'In progress - good pace'
    },
    {
      wo_operation_id: '5',
      operation_code: 'INSP001',
      operation_name: 'Leakage Testing',
      sequence_order: 5,
      status: 'PENDING',
      scheduled_start_date: '2024-01-23T08:00:00',
      scheduled_end_date: '2024-01-23T16:00:00',
      actual_start_date: null,
      actual_end_date: null,
      quantity_planned: 95,
      quantity_completed: 0,
      quantity_scrapped: 0,
      assigned_operator: null,
      work_center: 'WC007',
      machine_used: null,
      quality_status: 'PENDING',
      notes: null
    },
    {
      wo_operation_id: '6',
      operation_code: 'PAINT001',
      operation_name: 'Painting',
      sequence_order: 6,
      status: 'PENDING',
      scheduled_start_date: '2024-01-24T08:00:00',
      scheduled_end_date: '2024-01-25T16:00:00',
      actual_start_date: null,
      actual_end_date: null,
      quantity_planned: 95,
      quantity_completed: 0,
      quantity_scrapped: 0,
      assigned_operator: null,
      work_center: 'WC005',
      machine_used: null,
      quality_status: 'PENDING',
      notes: null
    },
    {
      wo_operation_id: '7',
      operation_code: 'FINAL001',
      operation_name: 'Final Inspection',
      sequence_order: 7,
      status: 'PENDING',
      scheduled_start_date: '2024-01-26T08:00:00',
      scheduled_end_date: '2024-01-26T16:00:00',
      actual_start_date: null,
      actual_end_date: null,
      quantity_planned: 95,
      quantity_completed: 0,
      quantity_scrapped: 0,
      assigned_operator: null,
      work_center: 'WC007',
      machine_used: null,
      quality_status: 'PENDING',
      notes: null
    }
  ],
  progress: [
    {
      progress_id: '1',
      operator_name: 'John Smith',
      shift: 'DAY',
      quantity_produced: 100,
      quantity_scrapped: 2,
      scrap_reason: 'Edge defects',
      start_time: '2024-01-15T08:30:00',
      end_time: '2024-01-15T15:30:00',
      efficiency_percentage: 95.5,
      notes: 'Good performance overall'
    },
    {
      progress_id: '2',
      operator_name: 'Mike Johnson',
      shift: 'DAY',
      quantity_produced: 98,
      quantity_scrapped: 0,
      start_time: '2024-01-16T08:00:00',
      end_time: '2024-01-17T14:00:00',
      efficiency_percentage: 98.2,
      notes: 'Excellent work'
    }
  ]
};

const WorkOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [workOrder, setWorkOrder] = useState(mockWorkOrderDetail);
  const [loading, setLoading] = useState(false);

  const statusConfig = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Play },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    ON_HOLD: { label: 'On Hold', color: 'bg-orange-100 text-orange-800', icon: Pause },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const priorityConfig = {
    LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
    MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
  };

  const qualityConfig = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    PASSED: { label: 'Passed', color: 'bg-green-100 text-green-800' },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    REWORK: { label: 'Rework', color: 'bg-orange-100 text-orange-800' }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getQuantityProgressPercentage = (produced: number, ordered: number) => {
    return ordered > 0 ? Math.round((produced / ordered) * 100) : 0;
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'COMPLETED' && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
                  {workOrder.wo_number}
                </h1>
                <p className="text-gray-600 text-lg">{workOrder.part_description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={statusConfig[workOrder.status as keyof typeof statusConfig]?.color}>
                {(() => {
                  const StatusIcon = statusConfig[workOrder.status as keyof typeof statusConfig]?.icon;
                  return StatusIcon ? <StatusIcon className="w-3 h-3 mr-1" /> : null;
                })()}
                {statusConfig[workOrder.status as keyof typeof statusConfig]?.label}
              </Badge>
              <Badge variant="outline" className={priorityConfig[workOrder.priority as keyof typeof priorityConfig]?.color}>
                {priorityConfig[workOrder.priority as keyof typeof priorityConfig]?.label}
              </Badge>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quantity Progress</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {workOrder.quantity_produced}/{workOrder.quantity_ordered}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getQuantityProgressPercentage(workOrder.quantity_produced, workOrder.quantity_ordered)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getQuantityProgressPercentage(workOrder.quantity_produced, workOrder.quantity_ordered)}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Operations Progress</CardTitle>
            <Route className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {workOrder.completed_operations}/{workOrder.total_operations}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage(workOrder.completed_operations, workOrder.total_operations)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getProgressPercentage(workOrder.completed_operations, workOrder.total_operations)}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Start: {new Date(workOrder.start_date).toLocaleDateString()}</p>
              <p className={cn(
                isOverdue(workOrder.due_date, workOrder.status) && "text-red-600 font-medium"
              )}>
                Due: {new Date(workOrder.due_date).toLocaleDateString()}
              </p>
              {isOverdue(workOrder.due_date, workOrder.status) && (
                <Badge className="bg-red-100 text-red-800 mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recipe Info</CardTitle>
            <Settings className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{workOrder.recipe_name}</p>
              <p>Version: {workOrder.recipe_version}</p>
              <p>Model: {workOrder.model}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">
            <Route className="w-4 h-4 mr-2" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="progress">
            <Play className="w-4 h-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="details">
            <Factory className="w-4 h-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="space-y-4">
            {workOrder.operations.map((operation) => {
              const StatusIcon = statusConfig[operation.status as keyof typeof statusConfig]?.icon || Clock;
              const operationProgress = getProgressPercentage(operation.quantity_completed, operation.quantity_planned);
              
              return (
                <Card key={operation.wo_operation_id} className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                          {operation.sequence_order}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{operation.operation_name}</h4>
                          <p className="text-sm text-gray-600">{operation.operation_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[operation.status as keyof typeof statusConfig]?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[operation.status as keyof typeof statusConfig]?.label}
                        </Badge>
                        <Badge variant="outline" className={qualityConfig[operation.quality_status as keyof typeof qualityConfig]?.color}>
                          {qualityConfig[operation.quality_status as keyof typeof qualityConfig]?.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Operator</span>
                        </div>
                        <p className="text-sm text-gray-800">{operation.assigned_operator || 'Not assigned'}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Work Center</span>
                        </div>
                        <p className="text-sm text-gray-800">{operation.work_center}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${operationProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{operationProgress}%</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {operation.quantity_completed}/{operation.quantity_planned} completed
                        </p>
                      </div>
                    </div>
                    {operation.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {operation.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="space-y-4">
            {workOrder.progress.map((prog) => (
              <Card key={prog.progress_id} className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{prog.operator_name}</h4>
                        <p className="text-sm text-gray-600">{prog.shift} Shift</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {prog.efficiency_percentage}% Efficiency
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{prog.quantity_produced}</p>
                      <p className="text-sm text-gray-600">Produced</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{prog.quantity_scrapped}</p>
                      <p className="text-sm text-gray-600">Scrapped</p>
                      {prog.scrap_reason && (
                        <p className="text-xs text-red-500 mt-1">{prog.scrap_reason}</p>
                      )}
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{prog.efficiency_percentage}%</p>
                      <p className="text-sm text-gray-600">Efficiency</p>
                    </div>
                  </div>
                  {prog.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {prog.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Customer Information</Label>
                    <p className="text-gray-800">{workOrder.customer_name}</p>
                    <p className="text-sm text-gray-500">Order: {workOrder.customer_order_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Part Information</Label>
                    <p className="text-gray-800">{workOrder.part_number} - {workOrder.part_description}</p>
                    <p className="text-sm text-gray-500">Model: {workOrder.model}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Production Details</Label>
                    <p className="text-gray-800">Quantity Ordered: {workOrder.quantity_ordered}</p>
                    <p className="text-gray-800">Quantity Produced: {workOrder.quantity_produced}</p>
                    <p className="text-gray-800">Recipe: {workOrder.recipe_name} v{workOrder.recipe_version}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Timeline</Label>
                    <p className="text-gray-800">Created: {new Date(workOrder.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-800">Start: {new Date(workOrder.start_date).toLocaleDateString()}</p>
                    <p className="text-gray-800">Due: {new Date(workOrder.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkOrderDetail;