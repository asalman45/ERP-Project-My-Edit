import { 
  OEM, 
  Model, 
  UOM, 
  Product, 
  WorkOrder, 
  InventoryItem, 
  InventoryTransaction, 
  BOM, 
  BOMItem, 
  WorkOrderStep 
} from "@/types";

export const sampleOEMs: OEM[] = [
  { id: "1", name: "Toyota", createdAt: "2024-01-15" },
  { id: "2", name: "Honda", createdAt: "2024-01-20" },
  { id: "3", name: "BMW", createdAt: "2024-02-01" },
  { id: "4", name: "Mercedes", createdAt: "2024-02-05" },
];

export const sampleModels: Model[] = [
  { id: "1", name: "Camry", year: "2024", oemId: "1", oemName: "Toyota", createdAt: "2024-01-16" },
  { id: "2", name: "Corolla", year: "2023", oemId: "1", oemName: "Toyota", createdAt: "2024-01-17" },
  { id: "3", name: "Civic", year: "2024", oemId: "2", oemName: "Honda", createdAt: "2024-01-21" },
  { id: "4", name: "Accord", year: "2023", oemId: "2", oemName: "Honda", createdAt: "2024-01-22" },
  { id: "5", name: "X5", year: "2024", oemId: "3", oemName: "BMW", createdAt: "2024-02-02" },
  { id: "6", name: "C-Class", year: "2024", oemId: "4", oemName: "Mercedes", createdAt: "2024-02-06" },
];

export const sampleUOMs: UOM[] = [
  { id: "1", code: "PCS", name: "Pieces", createdAt: "2024-01-10" },
  { id: "2", code: "KG", name: "Kilograms", createdAt: "2024-01-10" },
  { id: "3", code: "M", name: "Meters", createdAt: "2024-01-10" },
  { id: "4", code: "L", name: "Liters", createdAt: "2024-01-10" },
  { id: "5", code: "SET", name: "Set", createdAt: "2024-01-10" },
];

export const sampleProducts: Product[] = [
  {
    id: "1",
    code: "ENG-001",
    partName: "Engine Block",
    oemId: "1",
    oemName: "Toyota",
    modelId: "1",
    modelName: "Camry",
    uomId: "1",
    uomCode: "PCS",
    standardCost: 1500.00,
    category: "FINISHED_GOOD",
    createdAt: "2024-01-18"
  },
  {
    id: "2",
    code: "BRK-001",
    partName: "Brake Pad Set",
    oemId: "2",
    oemName: "Honda",
    modelId: "3",
    modelName: "Civic",
    uomId: "5",
    uomCode: "SET",
    standardCost: 120.00,
    category: "FINISHED_GOOD",
    createdAt: "2024-01-23"
  },
  {
    id: "3",
    code: "FLT-001",
    partName: "Oil Filter",
    oemId: "1",
    oemName: "Toyota",
    modelId: "2",
    modelName: "Corolla",
    uomId: "1",
    uomCode: "PCS",
    standardCost: 25.00,
    category: "SEMI_FINISHED",
    createdAt: "2024-01-25"
  },
  {
    id: "4",
    code: "STL-001",
    partName: "Steel Sheet",
    oemId: "3",
    oemName: "BMW",
    modelId: "5",
    modelName: "X5",
    uomId: "2",
    uomCode: "KG",
    standardCost: 5.50,
    category: "RAW_MATERIAL",
    createdAt: "2024-02-03"
  },
];

export const sampleWorkOrders: WorkOrder[] = [
  { 
    id: "1", 
    number: "WO-2024-001", 
    productId: "1",
    productName: "Engine Block",
    quantity: 10,
    status: "IN_PROGRESS", 
    startDate: "2024-03-01",
    endDate: "2024-03-15",
    progress: 60,
    currentStep: "WELDING",
    createdAt: "2024-03-01" 
  },
  { 
    id: "2", 
    number: "WO-2024-002", 
    productId: "2",
    productName: "Brake Pad Set",
    quantity: 50,
    status: "PENDING", 
    startDate: "2024-03-05",
    progress: 0,
    currentStep: "CUTTING",
    createdAt: "2024-03-02" 
  },
  { 
    id: "3", 
    number: "WO-2024-003", 
    productId: "3",
    productName: "Oil Filter",
    quantity: 100,
    status: "COMPLETED", 
    startDate: "2024-02-28",
    endDate: "2024-03-05",
    progress: 100,
    currentStep: "FINISHED_GOODS",
    createdAt: "2024-02-28" 
  },
  { 
    id: "4", 
    number: "WO-2024-004", 
    productId: "1",
    productName: "Engine Block",
    quantity: 5,
    status: "IN_PROGRESS", 
    startDate: "2024-03-03",
    progress: 25,
    currentStep: "CUTTING",
    createdAt: "2024-03-03" 
  },
];

export const sampleInventoryItems: InventoryItem[] = [
  {
    id: "1",
    productId: "4",
    productName: "Steel Sheet",
    productCode: "STL-001",
    batchNo: "B2024001",
    location: "Raw Material Store",
    quantityOnHand: 500,
    reservedQuantity: 50,
    availableQuantity: 450,
    uomId: "2",
    uomCode: "KG",
    status: "AVAILABLE",
    lastUpdated: "2024-03-10"
  },
  {
    id: "2",
    productId: "1",
    productName: "Engine Block",
    productCode: "ENG-001",
    batchNo: "B2024002",
    location: "Finished Goods",
    quantityOnHand: 25,
    reservedQuantity: 10,
    availableQuantity: 15,
    uomId: "1",
    uomCode: "PCS",
    status: "AVAILABLE",
    lastUpdated: "2024-03-10"
  },
  {
    id: "3",
    productId: "2",
    productName: "Brake Pad Set",
    productCode: "BRK-001",
    batchNo: "B2024003",
    location: "Warehouse A",
    quantityOnHand: 5,
    reservedQuantity: 0,
    availableQuantity: 5,
    uomId: "5",
    uomCode: "SET",
    status: "LOW_STOCK",
    lastUpdated: "2024-03-09"
  },
  {
    id: "4",
    productId: "3",
    productName: "Oil Filter",
    productCode: "FLT-001",
    batchNo: "B2024004",
    location: "Production Floor",
    quantityOnHand: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    uomId: "1",
    uomCode: "PCS",
    status: "OUT_OF_STOCK",
    lastUpdated: "2024-03-08"
  }
];

export const sampleBOMs: BOM[] = [
  {
    id: "1",
    productId: "1",
    productName: "Engine Block",
    version: "V1.0",
    isActive: true,
    items: [
      {
        id: "1",
        bomId: "1",
        componentId: "4",
        componentName: "Steel Sheet",
        componentCode: "STL-001",
        quantity: 15,
        uomId: "2",
        uomCode: "KG",
        step: "CUTTING"
      }
    ],
    createdAt: "2024-01-20"
  }
];

export const sampleWorkOrderSteps: WorkOrderStep[] = [
  {
    id: "1",
    workOrderId: "1",
    step: "CUTTING",
    status: "COMPLETED",
    startTime: "2024-03-01T08:00:00",
    endTime: "2024-03-01T12:00:00",
    completedBy: "John Smith",
    remarks: "Cutting completed as per specifications",
    requiredMaterials: [
      {
        id: "1",
        bomId: "1",
        componentId: "4",
        componentName: "Steel Sheet",
        componentCode: "STL-001",
        quantity: 15,
        uomId: "2",
        uomCode: "KG",
        step: "CUTTING"
      }
    ]
  },
  {
    id: "2",
    workOrderId: "1",
    step: "WELDING",
    status: "IN_PROGRESS",
    startTime: "2024-03-02T08:00:00",
    requiredMaterials: []
  },
  {
    id: "3",
    workOrderId: "1",
    step: "ASSEMBLY",
    status: "PENDING",
    requiredMaterials: []
  },
  {
    id: "4",
    workOrderId: "1",
    step: "QA",
    status: "PENDING",
    requiredMaterials: []
  },
  {
    id: "5",
    workOrderId: "1",
    step: "FINISHED_GOODS",
    status: "PENDING",
    requiredMaterials: []
  }
];

export const sampleInventoryTransactions: InventoryTransaction[] = [
  {
    id: "1",
    date: "2024-03-10T10:30:00",
    productId: "4",
    productName: "Steel Sheet",
    productCode: "STL-001",
    quantity: 15,
    type: "ISSUE",
    workOrderId: "1",
    workOrderNumber: "WO-2024-001",
    step: "CUTTING",
    location: "Raw Material Store",
    batchNo: "B2024001",
    userId: "user1",
    userName: "John Smith",
    remarks: "Issued for engine block cutting"
  },
  {
    id: "2",
    date: "2024-03-09T14:15:00",
    productId: "2",
    productName: "Brake Pad Set",
    productCode: "BRK-001",
    quantity: 20,
    type: "RECEIVE",
    location: "Warehouse A",
    batchNo: "B2024003",
    userId: "user2",
    userName: "Jane Doe",
    remarks: "Received from production"
  }
];