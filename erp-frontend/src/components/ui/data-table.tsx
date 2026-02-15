import React, { useState } from "react";
import { ChevronUp, ChevronDown, Edit, Trash2, Database, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  searchable = true,
  searchPlaceholder = "Search...",
  loading = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data based on search term
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const getValue = (row: T, column: Column<T>) => {
    if (typeof column.key === "string" && column.key.includes(".")) {
      const keys = column.key.split(".");
      return keys.reduce((obj, key) => obj?.[key], row);
    }
    return row[column.key as keyof T];
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Search and Filters */}
      {searchable && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-300 group-focus-within:text-blue-500" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 hover:bg-gray-50 focus:bg-white shadow-sm hover:shadow-md"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/40 px-3 py-2 rounded-lg border border-white/30">
                <Database className="w-4 h-4" />
                <span className="font-medium">{paginatedData.length}</span>
                <span>of</span>
                <span className="font-medium">{filteredData.length}</span>
                <span>entries</span>
              </div>
              
              {filteredData.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/40 px-3 py-2 rounded-lg border border-white/30">
                  <Filter className="w-4 h-4" />
                  <span>Filtered</span>
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      "{searchTerm}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      "px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 transition-colors duration-200",
                      column.sortable && "cursor-pointer select-none hover:text-gray-900 hover:bg-gray-50"
                    )}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            size={14}
                            className={
                              sortColumn === String(column.key) && sortDirection === "asc"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }
                          />
                          <ChevronDown
                            size={14}
                            className={
                              sortColumn === String(column.key) && sortDirection === "desc"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur opacity-30"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-700 font-medium">Loading data...</p>
                        <p className="text-gray-500 text-sm">Please wait while we fetch your information</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                        <Database className="w-10 h-10 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 font-medium text-lg">No data available</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {searchTerm ? `No results found for "${searchTerm}"` : "Start by adding your first item"}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group">
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-6 py-4 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {column.render
                          ? column.render(getValue(row, column), row)
                          : String(getValue(row, column) || "")}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-100 hover:text-blue-700 relative z-10"
                              style={{ willChange: 'opacity' }}
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(row)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100 hover:text-red-700 relative z-10"
                              style={{ willChange: 'opacity' }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="w-4 h-4" />
              <span>Showing</span>
              <span className="font-medium text-gray-800">{paginatedData.length}</span>
              <span>of</span>
              <span className="font-medium text-gray-800">{filteredData.length}</span>
              <span>entries</span>
              <span className="text-gray-500">(Page {currentPage} of {totalPages})</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-white/70 hover:bg-white/90 border-white/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4 rotate-90 mr-1" />
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 p-0 transition-all duration-300 hover:scale-105",
                        pageNum === currentPage 
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg" 
                          : "bg-white/70 hover:bg-white/90 border-white/30"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-white/70 hover:bg-white/90 border-white/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronDown className="w-4 h-4 -rotate-90 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}