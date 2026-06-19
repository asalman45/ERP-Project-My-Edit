import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers, Upload, Calculator, Box, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// API configuration
const API_URL = '/api/advanced-nesting';

export default function AdvancedNestingDisplay() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sheetDims, setSheetDims] = useState({ width: 1220, length: 2440 });
  const [parts, setParts] = useState<{ id: string, name: string, width: number, length: number, quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [newPart, setNewPart] = useState({
    name: '',
    width: '',
    length: '',
    quantity: '1',
    shapeType: 'rectangle', // 'rectangle' | 'triangle' | 'oval' | 'l-shape' | 'custom'
    polygon: null as any[] | null,
    svgPath: ''
  });
  const [cadFile, setCadFile] = useState<File | null>(null);

  const handleAddPart = () => {
    if (!newPart.width || !newPart.length || !newPart.quantity) return;
    
    const w = parseFloat(newPart.width);
    const l = parseFloat(newPart.length);
    let polygon = newPart.polygon;
    let svgPath = newPart.svgPath;

    if (newPart.shapeType !== 'custom' || !polygon || !svgPath) {
      if (newPart.shapeType === 'triangle') {
        polygon = [
          { x: 0, y: l },
          { x: w / 2, y: 0 },
          { x: w, y: l }
        ];
        svgPath = `M 0 ${l} L ${w/2} 0 L ${w} ${l} Z`;
      } else if (newPart.shapeType === 'oval') {
        const points = [];
        const segments = 16;
        const rx = w / 2;
        const ry = l / 2;
        for (let i = 0; i < segments; i++) {
          const angle = (i * 2 * Math.PI) / segments;
          points.push({
            x: rx + rx * Math.cos(angle),
            y: ry + ry * Math.sin(angle)
          });
        }
        polygon = points;
        svgPath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
      } else if (newPart.shapeType === 'l-shape') {
        const thickness = 0.3; // 30% thickness
        polygon = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: l * thickness },
          { x: w * thickness, y: l * thickness },
          { x: w * thickness, y: l },
          { x: 0, y: l }
        ];
        svgPath = `M 0 0 L ${w} 0 L ${w} ${l*thickness} L ${w*thickness} ${l*thickness} L ${w*thickness} ${l} L 0 ${l} Z`;
      } else {
        // default rectangle
        polygon = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: l },
          { x: 0, y: l }
        ];
        svgPath = `M 0 0 L ${w} 0 L ${w} ${l} L 0 ${l} Z`;
      }
    }

    setParts([...parts, {
      id: Math.random().toString(36).substring(7),
      name: newPart.name || `Part ${parts.length + 1}`,
      width: w,
      length: l,
      quantity: parseInt(newPart.quantity),
      shapeType: newPart.shapeType,
      polygon,
      svgPath
    }]);
    
    setNewPart({
      name: '',
      width: '',
      length: '',
      quantity: '1',
      shapeType: 'rectangle',
      polygon: null,
      svgPath: ''
    });
  };

  const removePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCadFile(file);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/upload-cad`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to parse DXF file');
      }

      const { extractedWidth, extractedLength, polygon, svgPath } = data.data;
      
      setNewPart({
        name: file.name.split('.')[0],
        width: extractedWidth.toString(),
        length: extractedLength.toString(),
        quantity: '1',
        shapeType: 'custom',
        polygon: polygon,
        svgPath: svgPath
      });
      
      toast({
        title: "CAD Processed",
        description: `Extracted dimensions: ${extractedWidth}x${extractedLength}mm`,
      });
    } catch (error) {
      console.error('Error uploading CAD:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to parse DXF file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      // Reset input so same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const calculateBatch = async () => {
    if (parts.length === 0) {
      toast({ title: "No Parts", description: "Add parts to nest first", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/calculate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parts,
          sheetWidth: sheetDims.width,
          sheetLength: sheetDims.length,
          options: { rotation: true, spacing: 2 }
        })
      });
      
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not calculate nesting');
      }
      
      setResult(data.data);
      toast({ title: "Optimization Complete", description: "Batch nesting calculated successfully" });
    } catch (error) {
      console.error('Error calculating batch:', error);
      toast({ title: "Optimization Failed", description: "Could not calculate nesting", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate random pastel color for visualization
  const getColorForPart = (index: number) => {
    const hue = (index * 137.508) % 360; // Use golden angle approximation for distinct colors
    return `hsl(${hue}, 70%, 80%)`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Nesting Studio</h1>
        <p className="text-gray-600 mt-1">Multi-part heterogeneous rectangular and true-shape nesting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Input Forms */}
        <div className="col-span-1 space-y-6">
          
          <Card>
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" />
                Sheet & Material
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sheet Width (mm)</Label>
                  <Input 
                    type="number" 
                    value={sheetDims.width} 
                    onChange={e => setSheetDims({...sheetDims, width: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sheet Length (mm)</Label>
                  <Input 
                    type="number" 
                    value={sheetDims.length} 
                    onChange={e => setSheetDims({...sheetDims, length: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-purple-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Add Parts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* CAD Upload Section */}
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Upload CAD File (DXF)</p>
                <p className="text-xs text-gray-500 mt-1">Extract dimensions for True Shape Nesting</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".dxf,.svg" 
                  onChange={handleFileUpload} 
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-500">OR ENTER MANUALLY</span></div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Part Name (Optional)</Label>
                  <Input 
                    placeholder="e.g. Bracket A" 
                    value={newPart.name} 
                    onChange={e => setNewPart({...newPart, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Shape Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newPart.shapeType}
                    onChange={e => setNewPart({...newPart, shapeType: e.target.value})}
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="triangle">Triangle</option>
                    <option value="oval">Oval</option>
                    <option value="l-shape">L-Shape</option>
                    {newPart.shapeType === 'custom' && <option value="custom">Custom (DXF Uploaded)</option>}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Width (mm)</Label>
                    <Input 
                      type="number" 
                      placeholder="W" 
                      value={newPart.width} 
                      onChange={e => setNewPart({...newPart, width: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Length (mm)</Label>
                    <Input 
                      type="number" 
                      placeholder="L" 
                      value={newPart.length} 
                      onChange={e => setNewPart({...newPart, length: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Quantity needed</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={newPart.quantity} 
                    onChange={e => setNewPart({...newPart, quantity: e.target.value})}
                  />
                </div>
                <Button className="w-full" onClick={handleAddPart}>
                  Add Part to Batch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Parts & Results */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Parts Batch ({parts.reduce((acc, p) => acc + p.quantity, 0)} total pcs)</CardTitle>
              <Button onClick={calculateBatch} disabled={parts.length === 0 || loading} className="bg-green-600 hover:bg-green-700">
                {loading ? 'Calculating...' : <><Calculator className="w-4 h-4 mr-2" /> Optimize Batch</>}
              </Button>
            </CardHeader>
            <CardContent>
              {parts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No parts added to the batch yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {parts.map((part, idx) => (
                    <div key={part.id} className="p-3 border rounded-lg flex justify-between items-start" style={{ borderLeftColor: getColorForPart(idx), borderLeftWidth: '4px' }}>
                      <div>
                        <p className="font-medium text-sm">{part.name}</p>
                        <p className="text-xs text-gray-500">{part.width} × {part.length} mm</p>
                        <Badge variant="secondary" className="mt-1">{part.quantity} pcs</Badge>
                      </div>
                      <button onClick={() => removePart(part.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Display */}
          {result && (
            <Card className="border-green-200">
              <CardHeader className="bg-green-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Nesting Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Sheets Needed</p>
                    <p className="text-2xl font-bold">{result.sheetsNeeded}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Avg Efficiency</p>
                    <p className="text-2xl font-bold">
                      {(result.packedSheets.reduce((acc: number, s: any) => acc + s.efficiency, 0) / result.packedSheets.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Unpacked Items</p>
                    <p className="text-2xl font-bold text-red-600">{result.unpackedItems?.length || 0}</p>
                  </div>
                </div>

                {/* SVG Visualizations */}
                <div className="space-y-6">
                  {result.packedSheets.map((sheet: any, sheetIdx: number) => {
                    const scale = Math.min(800 / sheet.sheetWidth, 400 / sheet.sheetLength);
                    const viewBoxW = sheet.sheetWidth;
                    const viewBoxH = sheet.sheetLength;

                    return (
                      <div key={sheetIdx} className="space-y-2">
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span>Sheet {sheet.sheetIndex}</span>
                          <span className={sheet.efficiency > 80 ? "text-green-600" : "text-orange-600"}>
                            {sheet.efficiency.toFixed(1)}% Yield
                          </span>
                        </div>
                        <div className="border bg-gray-50 overflow-hidden flex justify-center p-4">
                          <svg 
                            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} 
                            style={{ 
                              width: '100%', 
                              maxHeight: '400px',
                              backgroundColor: '#e5e7eb', // sheet background
                              border: '1px solid #9ca3af'
                            }}
                          >
                            {/* The Sheet */}
                            <rect x="0" y="0" width={viewBoxW} height={viewBoxH} fill="#ffffff" stroke="#9ca3af" strokeWidth="2" />
                            
                            {/* The Nested Parts */}
                            {sheet.parts.map((part: any, pIdx: number) => {
                              // Find the original part index to get consistent color
                              const originalPartIndex = parts.findIndex(p => p.id === part.id);
                              const fillColor = getColorForPart(originalPartIndex >= 0 ? originalPartIndex : pIdx);
                              
                              const pointsString = part.vertices
                                ? part.vertices.map((v: any) => `${v.x},${v.y}`).join(' ')
                                : `${part.x},${part.y} ${part.x + part.width},${part.y} ${part.x + part.width},${part.y + part.height} ${part.x},${part.y + part.height}`;

                              return (
                                <g key={pIdx}>
                                  <polygon 
                                    points={pointsString}
                                    fill={fillColor} 
                                    stroke="#374151" 
                                    strokeWidth="1"
                                  />
                                  {/* Draw text label if box is large enough */}
                                  {part.width > 50 && part.height > 50 && (
                                    <text 
                                      x={part.x + part.width / 2} 
                                      y={part.y + part.height / 2} 
                                      textAnchor="middle" 
                                      dominantBaseline="middle"
                                      fontSize={Math.min(part.width, part.height) * 0.2}
                                      fill="#1f2937"
                                      pointerEvents="none"
                                    >
                                      {part.partName}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
