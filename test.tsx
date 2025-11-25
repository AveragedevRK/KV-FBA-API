import React, { useState, useRef, useEffect, useMemo } from 'react';
import DashboardCard from './DashboardCard';
import { Calendar, Truck, TrendingUp, Package, Percent, Info, ArrowRight } from 'lucide-react';
import { Shipment } from '../types';

interface ShipmentsPageProps {
  onNavigate: (view: string) => void;
}

// Reusing DASHBOARD_MOCK_SHIPMENTS from DashboardPage for consistency
const DASHBOARD_MOCK_SHIPMENTS: Shipment[] = [
  { id: '1', shipmentId: 'SHP-1', name: 'S1', destination: 'D1', originWarehouse: 'W1', totalItems: 120, carrier: 'UPS', status: 'In Progress', createdDate: '2025-05-12T10:00:00', lastUpdated: '', items: [{ sku: 'WH-001', name: 'Wireless Headphones', asin: '', quantity: 50 }, { sku: 'EM-202', name: 'Ergonomic Mouse', asin: '', quantity: 70 }] },
  { id: '2', shipmentId: 'SHP-2', name: 'S2', destination: 'D2', originWarehouse: 'W1', totalItems: 450, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-05-10T10:00:00', lastUpdated: '', items: [{ sku: 'LS-303', name: 'Laptop Stand', asin: '', quantity: 200 }, { sku: 'CB-101', name: 'USB-C Cable (2m)', asin: '', quantity: 250 }] },
  { id: '3', shipmentId: 'S3', name: 'S3', destination: 'D3', originWarehouse: 'W1', totalItems: 15, carrier: 'DHL', status: 'Delivered', createdDate: '2025-05-08T10:00:00', lastUpdated: '', items: [{ sku: 'MK-550', name: 'Mechanical Keyboard', asin: '', quantity: 15 }] },
  { id: '4', shipmentId: 'SHP-4', name: 'S4', destination: 'D4', originWarehouse: 'W1', totalItems: 200, carrier: 'UPS', status: 'Draft', createdDate: '2025-05-14T10:00:00', lastUpdated: '', items: [{ sku: 'MA-800', name: 'Monitor Arm', asin: '', quantity: 100 }, { sku: 'WC-400', name: 'Webcam 4K', asin: '', quantity: 100 }] },
  { id: '5', shipmentId: 'SHP-5', name: 'S5', destination: 'D5', originWarehouse: 'W1', totalItems: 5, carrier: 'USPS', status: 'Cancelled', createdDate: '2025-05-05T10:00:00', lastUpdated: '', items: [{ sku: 'DM-012', name: 'Desk Mat', asin: '', quantity: 5 }] },
  { id: '6', shipmentId: 'S6', name: 'S6', destination: 'D6', originWarehouse: 'W1', totalItems: 1200, carrier: 'Maersk', status: 'In Progress', createdDate: '2025-05-13T10:00:00', lastUpdated: '', items: [{ sku: 'LG-900', name: 'Gaming Monitor 27"', asin: '', quantity: 1200 }] },
  { id: '7', shipmentId: 'S7', name: 'S7', destination: 'D7', originWarehouse: 'W1', totalItems: 50, carrier: 'Internal', status: 'Shipped', createdDate: '2025-05-12T10:00:00', lastUpdated: '', items: [{ sku: 'SP-101', name: 'Smart Plug', asin: '', quantity: 50 }] },
  { id: '8', shipmentId: 'S8', name: 'S8', destination: 'D8', originWarehouse: 'W1', totalItems: 240, carrier: 'FedEx', status: 'Delivered', createdDate: '2025-05-01T10:00:00', lastUpdated: '', items: [{ sku: 'EM-202', name: 'Ergonomic Mouse', asin: '', quantity: 240 }] },
  { id: '9', shipmentId: 'SHP-9', name: 'S9', destination: 'D9', originWarehouse: 'W1', totalItems: 0, carrier: 'UPS', status: 'Draft', createdDate: '2025-05-15T10:00:00', lastUpdated: '' },
  { id: '10', shipmentId: 'SHP-10', name: 'S10', destination: 'D10', originWarehouse: 'W1', totalItems: 300, carrier: 'UPS', status: 'Shipped', createdDate: '2025-04-28T10:00:00', lastUpdated: '', items: [{ sku: 'WH-001', name: 'Wireless Headphones', asin: '', quantity: 150 }, { sku: 'LS-303', name: 'Laptop Stand', asin: '', quantity: 150 }] },
  { id: '11', shipmentId: 'S11-WH001', name: 'S11-WH001', destination: 'D11', originWarehouse: 'W1', totalItems: 10, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-04-25T10:00:00', lastUpdated: '', items: [{ sku: 'WH-001', name: 'Wireless Headphones', asin: '', quantity: 10 }] },
  { id: '11B', shipmentId: 'S11-EM202', name: 'S11-EM202', destination: 'D11', originWarehouse: 'W1', totalItems: 5, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-04-25T10:00:00', lastUpdated: '', items: [{ sku: 'EM-202', name: 'Ergonomic Mouse', asin: '', quantity: 5 }] },
  { id: '12', shipmentId: 'S12', name: 'S12', destination: 'D12', originWarehouse: 'W1', totalItems: 500, carrier: 'DHL', status: 'Shipped', createdDate: '2025-04-20T10:00:00', lastUpdated: '', items: [{ sku: 'CB-101', name: 'USB-C Cable (2m)', asin: '', quantity: 500 }] },
  { id: '13', shipmentId: 'S13', name: 'S13', destination: 'D13', originWarehouse: 'W1', totalItems: 150, carrier: 'UPS', status: 'Shipped', createdDate: '2025-05-09T10:00:00', lastUpdated: '', items: [{ sku: 'DM-012', name: 'Desk Mat', asin: '', quantity: 100 }, { sku: 'SP-101', name: 'Smart Plug', asin: '', quantity: 50 }] },
  { id: '14', shipmentId: 'S14', name: 'S14', destination: 'D14', originWarehouse: 'W1', totalItems: 250, carrier: 'FedEx', status: 'Shipped', createdDate: '2025-05-07T10:00:00', lastUpdated: '', items: [{ sku: 'LS-303', name: 'Laptop Stand', asin: '', quantity: 250 }] },
  { id: '15', shipmentId: 'S15', name: 'S15', destination: 'D15', originWarehouse: 'W1', totalItems: 75, carrier: 'DHL', status: 'Delivered', createdDate: '2025-05-06T10:00:00', lastUpdated: '', items: [{ sku: 'MA-800', name: 'Monitor Arm', asin: '', quantity: 75 }] },
  { id: '16', shipmentId: 'S16', name: 'S16', destination: 'D16', originWarehouse: 'W1', totalItems: 180, carrier: 'USPS', status: 'Shipped', createdDate: '2025-05-04T10:00:00', lastUpdated: '', items: [{ sku: 'WC-400', name: 'Webcam 4K', asin: '', quantity: 180 }] }
];

interface TooltipData {
  x: number;
  y: number;
  date: string;
  shipments: number; // For Shipments Over Time: Shipments shipped
  units: number;    // For Shipments Over Time: Units shipped
}

const ShipmentsPage: React.FC<ShipmentsPageProps> = ({ onNavigate }) => {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Interactive Chart State
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Metrics Calculation ---

  const {
    openShipmentsCount,
    shipmentsCreatedCount,
    shipmentsShippedCount,
    totalUnitsShippedForPeriod,
    averageUnitsPerShipment,
    chartData
  } = useMemo(() => {
    const today = new Date('2025-05-15'); // Fixed "Today" for demo consistency
    let daysToLookBack = 30;

    if (dateRange === 'Today') daysToLookBack = 1;
    if (dateRange === 'Last 7 Days') daysToLookBack = 7;
    if (dateRange === 'Last 30 Days') daysToLookBack = 30;
    if (dateRange === 'Year to Date') daysToLookBack = 135; // approx

    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - daysToLookBack + 1);

    // Filter shipments for the selected period
    const relevantShipmentsForPeriod = DASHBOARD_MOCK_SHIPMENTS.filter(s => {
      const d = new Date(s.createdDate);
      return d.toISOString().split('T')[0] >= cutoffDate.toISOString().split('T')[0] &&
             d.toISOString().split('T')[0] <= today.toISOString().split('T')[0];
    });

    // Metric 1: Open Shipments
    const openShipmentsCount = DASHBOARD_MOCK_SHIPMENTS.filter(s =>
      ['Draft', 'In Progress', 'Shipped'].includes(s.status)
    ).length;

    // Metric 2: Shipments Created (Selected Period)
    const shipmentsCreatedCount = relevantShipmentsForPeriod.length;

    // Metric 3: Shipments Shipped (Selected Period)
    const shipmentsShippedCount = relevantShipmentsForPeriod.filter(s =>
      ['Shipped', 'Delivered'].includes(s.status)
    ).length;

    // Helper for Average Units Per Shipment
    const totalUnitsShippedForPeriod = relevantShipmentsForPeriod
        .filter(s => ['Shipped', 'Delivered'].includes(s.status))
        .reduce((sum, s) => sum + s.totalItems, 0);

    const averageUnitsPerShipment = shipmentsShippedCount > 0
      ? (totalUnitsShippedForPeriod / shipmentsShippedCount).toFixed(1)
      : '0';

    // Chart Data: Shipments Over Time (Shipped/Delivered)
    const dailyData: Record<string, { shipments: number; units: number }> = {};

    for (let i = 0; i < daysToLookBack; i++) {
        const d = new Date(cutoffDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split('T')[0];
        dailyData[key] = { shipments: 0, units: 0 };
    }

    DASHBOARD_MOCK_SHIPMENTS
      .filter(s => ['Shipped', 'Delivered'].includes(s.status))
      .forEach(s => {
          const key = s.createdDate.split('T')[0];
          if (dailyData[key]) {
              dailyData[key].shipments += 1;
              dailyData[key].units += s.totalItems;
          }
      });

    const dataPoints = Object.keys(dailyData).sort().map(date => ({
        date,
        value: dailyData[date].shipments, // Chart by number of shipments
        units: dailyData[date].units     // Also pass units for tooltip
    }));

    return {
      openShipmentsCount,
      shipmentsCreatedCount,
      shipmentsShippedCount,
      totalUnitsShippedForPeriod,
      averageUnitsPerShipment,
      chartData: dataPoints
    };
  }, [dateRange]);


  // --- Helper to create smooth SVG path ---
  const getSmoothPath = (points: {value: number}[], width: number, height: number) => {
    if (points.length === 0) return { path: '', area: '', normalizeY: (v: number) => 0 };

    const maxY = Math.max(...points.map(p => p.value)) || 1;
    const stepX = width / (points.length - 1 || 1);

    const normalizeY = (val: number) => height - (val / maxY) * (height * 0.8) - (height * 0.1);

    let d = `M 0 ${normalizeY(points[0].value)}`;

    for (let i = 0; i < points.length - 1; i++) {
        const x0 = i * stepX;
        const y0 = normalizeY(points[i].value);
        const x1 = (i + 1) * stepX;
        const y1 = normalizeY(points[i+1].value);

        const cp1x = x0 + (x1 - x0) / 2;
        const cp1y = y0;
        const cp2x = x1 - (x1 - x0) / 2;
        const cp2y = y1;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`;
    }

    return {
      path: d,
      area: `${d} L ${width} ${height} L 0 ${height} Z`,
      normalizeY
    };
  };

  const chartInfo = useMemo(() => {
      return getSmoothPath(chartData, 1000, 300);
  }, [chartData]);


  // --- Interactive Chart Handlers ---
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (!chartData.length || !chartContainerRef.current) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const svgWidth = 1000;

    const svgX = (mouseX / svgRect.width) * svgWidth;

    const stepX = svgWidth / (chartData.length - 1 || 1);
    const index = Math.round(svgX / stepX);

    if (index >= 0 && index < chartData.length) {
      const dataPoint = chartData[index];
      const yPos = chartInfo.normalizeY(dataPoint.value);
      const xPercent = (index / (chartData.length - 1 || 1)) * 100;

      setTooltip({
        x: xPercent,
        y: yPos,
        date: new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        shipments: dataPoint.value,
        units: dataPoint.units // Use units here
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartData.length || !chartContainerRef.current) return;
    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    const svgRect = e.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - svgRect.left;
    const svgWidth = 1000;

    const svgX = (touchX / svgRect.width) * svgWidth;

    const stepX = svgWidth / (chartData.length - 1 || 1);
    const index = Math.round(svgX / stepX);

    if (index >= 0 && index < chartData.length) {
      const dataPoint = chartData[index];
      const yPos = chartInfo.normalizeY(dataPoint.value);
      const xPercent = (index / (chartData.length - 1 || 1)) * 100;

      setTooltip({
        x: xPercent,
        y: yPos,
        date: new Date(dataPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        shipments: dataPoint.value,
        units: dataPoint.units
      });
    } else {
      setTooltip(null);
    }
  };

  const hasChartData = chartData.length > 0 && chartData.some(d => d.value > 0);

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto animate-fade-in-fast no-scrollbar">

      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
        <div>
          <h1 className="text-[24px] font-bold text-[#f4f4f4]">Shipments</h1>
          <p className="text-[14px] text-[#c6c6c6]">High-level view of all shipment activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={dateDropdownRef}>
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className={`bg-[#262626] hover:bg-[#393939] border border-[#393939] text-[#f4f4f4] h-[40px] px-4 flex items-center gap-2 text-[14px] transition-colors duration-200 ${isDateDropdownOpen ? 'bg-[#393939]' : ''}`}
            >
              <Calendar size={16} />
              {dateRange}
            </button>
            {isDateDropdownOpen && (
              <div className="absolute top-full right-0 w-[200px] bg-[#262626] border border-[#393939] shadow-xl z-[var(--z-dropdown)] animate-drop-down origin-top-right">
                {['Today', 'Last 7 Days', 'Last 30 Days', 'Year to Date'].map((opt, idx) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setDateRange(opt);
                      setIsDateDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-[#393939] cursor-pointer text-[14px] text-[#c6c6c6] hover:text-[#f4f4f4] transition-colors"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Block: Go to Manage Shipments */}
      <div className="bg-[#262626] border border-[#393939] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
        <div>
          <h3 className="text-[18px] font-bold text-[#f4f4f4]">Go to Manage Shipments</h3>
          <p className="text-[14px] text-[#c6c6c6] mt-1">View, track and manage all active, past and planned shipments.</p>
        </div>
        <button
          onClick={() => onNavigate('manage-shipments')}
          className="h-[40px] px-6 bg-[#0f62fe] hover:bg-[#0353e9] text-white text-[14px] font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-200 shadow-lg shadow-[#0f62fe]/10 hover:shadow-[#0f62fe]/20"
        >
          Manage Shipments <ArrowRight size={16} />
        </button>
      </div>

      <div className="w-full border-t border-[#393939] mb-6 animate-fade-in-fast" style={{ animationDelay: '75ms' }} />

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

        {/* Card 1: Open Shipments */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
            <DashboardCard
              title="Open Shipments"
              value={openShipmentsCount}
              subtext="Shipments currently in progress."
              trend="neutral"
              icon={<Truck size={20} />}
            />
        </div>

        {/* Card 2: Shipments Created (Selected Period) */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
            <DashboardCard
              title="Shipments Created (Selected Period)"
              value={shipmentsCreatedCount}
              subtext="New shipments in selected period."
              trend="neutral"
              icon={<Package size={20} />}
            />
        </div>

        {/* Card 3: Shipments Shipped (Selected Period) */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
            <DashboardCard
              title="Shipments Shipped (Selected Period)"
              value={shipmentsShippedCount}
              subtext="Completed shipments in selected period."
              trend="up"
              icon={<TrendingUp size={20} />}
            />
        </div>

        {/* Card 4: Average Units Per Shipment */}
        <div className="opacity-0 animate-slide-up-fade" style={{ animationDelay: '250ms' }}>
            <DashboardCard
              title="Average Units Per Shipment"
              value={averageUnitsPerShipment}
              subtext="Average size of shipped orders."
              trend="neutral"
              icon={<Percent size={20} />}
            />
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#262626] border border-[#393939] p-6 flex flex-col h-[400px] opacity-0 animate-slide-up-fade relative" style={{ animationDelay: '300ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[18px] font-bold text-[#f4f4f4]">Shipments Over Time</h3>
            <div className="text-[12px] text-[#8d8d8d] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0f62fe]"></div>
                Shipments
            </div>
          </div>

          <div className="flex-1 w-full relative overflow-hidden" ref={chartContainerRef}>
             {hasChartData ? (
                <>
                  <svg
                    viewBox="0 0 1000 300"
                    className="w-full h-full preserve-3d"
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseLeave}
                  >
                      <defs>
                          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#0f62fe" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#0f62fe" stopOpacity="0" />
                          </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                          d={chartInfo.area}
                          fill="url(#chartGradient)"
                          className="animate-fade-in-fast pointer-events-none"
                      />

                      {/* Stroke Line */}
                      <path
                          d={chartInfo.path}
                          fill="none"
                          stroke="#0f62fe"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="animate-grow-bar pointer-events-none"
                          style={{ strokeDasharray: chartInfo.path.length, strokeDashoffset: chartInfo.path.length }}
                      />

                      {/* Hover Interaction Overlay: Transparent rect to capture events */}
                      <rect
                        width="1000"
                        height="300"
                        fill="transparent"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="cursor-crosshair"
                      />

                      {/* Active Point Indicator (only in SVG) */}
                      {tooltip && (
                         <circle
                            cx={(tooltip.x / 100) * 1000}
                            cy={tooltip.y}
                            r="5"
                            fill="#0f62fe"
                            stroke="#fff"
                            strokeWidth="2"
                            className="pointer-events-none"
                         />
                      )}

                      {/* Simple X Axis Line */}
                      <line x1="0" y1="298" x2="1000" y2="298" stroke="#393939" strokeWidth="1" className="pointer-events-none" />
                  </svg>

                  {/* HTML Tooltip Overlay */}
                  {tooltip && (
                     <div
                        className="absolute pointer-events-none z-[var(--z-popover)] bg-[#161616] border border-[#393939] p-3 rounded shadow-lg text-[12px] flex flex-col gap-1 min-w-[140px]"
                        style={{
                           left: `${tooltip.x}%`,
                           top: `${(tooltip.y / 300) * 100}%`,
                           transform: `translateX(${tooltip.x > 70 ? '-105%' : '5px'}) translateY(${tooltip.y / 300 > 0.5 ? '-105%' : '5px'})`
                        }}
                     >
                        <div className="text-[#c6c6c6] font-medium border-b border-[#333] pb-1 mb-1">
                           {tooltip.date}
                        </div>
                        <div className="flex justify-between gap-4">
                           <span className="text-[#8d8d8d]">Shipments shipped:</span>
                           <span className="text-[#f4f4f4] font-mono">{tooltip.shipments}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                           <span className="text-[#8d8d8d]">Units shipped:</span>
                           <span className="text-[#f4f4f4] font-mono font-bold">{tooltip.units}</span>
                        </div>
                     </div>
                  )}
                </>
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#c6c6c6]">
                    <Info size={32} className="mb-2 opacity-30" />
                    <p>No shipment data for this period.</p>
                </div>
             )}
          </div>

          {/* X Axis Labels */}
          {hasChartData && (
            <div className="flex justify-between mt-2 text-[11px] text-[#8d8d8d] font-mono px-2">
                <span>{new Date(chartData[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(chartData[Math.floor(chartData.length / 2)]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(chartData[chartData.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
      </div>

    </div>
  );
};

export default ShipmentsPage;
