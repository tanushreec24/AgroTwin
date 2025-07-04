"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from '~/trpc/react';
import Link from "next/link";
import { Home, BarChart3, ArrowLeft, Activity, MapPin, Leaf } from "lucide-react";
import { useParams } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import FarmPlotCard from "../_components/farm-plot-card";

const DEFAULT_SOIL_TYPE = "loam"; // fallback if not available

const SOIL_TYPE_OPTIONS = ["loam", "clay", "sandy", "acidic", "alkaline", "peaty", "saline", "chalky", "silty"];

// Infer soil type from sensor readings (simple heuristic)
function inferSoilType(liveReadings: any[] | undefined): string {
  if (!liveReadings) return DEFAULT_SOIL_TYPE;
  // Try to get latest values for relevant soil sensors
  const getLatest = (type: string) => {
    return liveReadings.find(
      (r) => r.sensor.name.toLowerCase().includes(type)
    )?.value;
  };
  const ph = getLatest("ph");
  const moisture = getLatest("moisture");
  // Simple rules (can be improved with more data):
  if (ph !== undefined) {
    if (ph < 5.5) return "acidic";
    if (ph > 7.5) return "alkaline";
  }
  if (moisture !== undefined) {
    if (moisture > 60) return "clay";
    if (moisture < 30) return "sandy";
  }
  return DEFAULT_SOIL_TYPE;
}

function exportPredictionsToCSV(plotName: string, yieldHistory: any[], irrigationHistory: any[]) {
  const rows = [
    ["Timestamp", "Yield Prediction", "Yield Confidence", "Irrigation Prediction", "Irrigation Confidence"],
  ];
  const len = Math.max(yieldHistory.length, irrigationHistory.length);
  for (let i = 0; i < len; i++) {
    const y = yieldHistory[i] || {};
    const irr = irrigationHistory[i] || {};
    rows.push([
      y.createdAt ? new Date(y.createdAt).toLocaleString() : irr.createdAt ? new Date(irr.createdAt).toLocaleString() : "",
      y.result ?? "",
      y.confidence ?? "",
      irr.result ?? "",
      irr.confidence ?? "",
    ]);
  }
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plotName.replace(/\s+/g, '_')}_predictions.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const FarmDetailPage = () => {
  const params = useParams();
  const farmId = params.id as string;
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch farm details
  const { data: farm, isLoading: farmLoading } = api.farm.getFarmById.useQuery(
    { id: farmId },
    { enabled: !!farmId }
  );

  // Fetch live sensor readings for this farm
  const { data: liveReadings, refetch: refetchLiveReadings } = api.sensorReading.getLiveReadings.useQuery(
    { farmId, limit: 30 },
    { refetchInterval: refreshInterval, enabled: !!farmId }
  );

  // Extract latest sensor values for prediction
  const latestValues = useMemo(() => {
    if (!liveReadings) return {};
    // Find latest values by type
    const getLatest = (type: string) => {
      return liveReadings.find(
        (r) => r.sensor.name.toLowerCase().includes(type)
      )?.value;
    };
    // Use the first plot's soilType as the farm's default, or fallback to inferred
    const verifiedSoilType = farm?.plots?.[0]?.soilType;
    return {
      rainfall: getLatest("rain"),
      temperature: getLatest("temp"),
      soil_moisture: getLatest("moisture"),
      soil_type: verifiedSoilType || inferSoilType(liveReadings),
    };
  }, [liveReadings, farm]);

  // Predict yield
  const yieldPrediction = api.prediction.predictYield.useMutation();
  // Predict irrigation
  const irrigationPrediction = api.prediction.predictIrrigation.useMutation();

  // Auto-run predictions when sensor data updates
  useEffect(() => {
    if (
      latestValues.rainfall !== undefined &&
      latestValues.temperature !== undefined
    ) {
      yieldPrediction.mutate({
        rainfall: Number(latestValues.rainfall),
        temperature: Number(latestValues.temperature),
        soil_type: latestValues.soil_type || DEFAULT_SOIL_TYPE,
      });
    }
    if (
      latestValues.soil_moisture !== undefined &&
      latestValues.rainfall !== undefined &&
      latestValues.temperature !== undefined
    ) {
      irrigationPrediction.mutate({
        soil_moisture: Number(latestValues.soil_moisture),
        rainfall: Number(latestValues.rainfall),
        temperature: Number(latestValues.temperature),
      });
    }
  }, [latestValues]);

  // Auto-refresh live data
  useEffect(() => {
    const interval = setInterval(() => {
      refetchLiveReadings();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refetchLiveReadings]);

  if (farmLoading) {
    return <div>Loading farm details...</div>;
  }

  if (!farm) {
    return <div>Farm not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors">
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </Link>
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors">
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center space-x-2 text-green-600">
                <Leaf className="h-5 w-5" />
                <span className="font-semibold">{farm.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Farm Details</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4">
        {/* Farm Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{farm.name}</h1>
                <div className="flex items-center text-gray-600 mt-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{farm.state}, {farm.district}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{farm.plots?.length || 0}</div>
                <div className="text-sm text-gray-500">Plots</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-green-800">Total Plots</div>
                <div className="text-2xl font-bold">{farm.plots?.length || 0}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-blue-800">Total Sensors</div>
                <div className="text-2xl font-bold">
                  {farm.plots?.reduce((total, plot) => total + (plot.sensors?.length || 0), 0) || 0}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-orange-800">Crops</div>
                <div className="text-2xl font-bold">
                  {new Set(farm.plots?.map(plot => plot.crop?.name).filter(Boolean)).size}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Sensor Monitoring */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">🌡️ Live Sensor Data</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Refresh:</span>
              <select 
                value={refreshInterval} 
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveReadings?.slice(0, 15).map((reading) => (
                <div key={reading.id} className="border rounded p-3 bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">{reading.sensor.name}</div>
                      <div className="text-xs text-gray-600">
                        Plot: {reading.plot && reading.plot.crop ? `${reading.plot.crop.commonName || 'Unknown Crop'}${reading.plot.crop.name && reading.plot.crop.commonName !== reading.plot.crop.name ? ` (${reading.plot.crop.name})` : ''}` : 'Unknown Crop'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {reading.value} {reading.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {liveReadings && liveReadings.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                🔄 Live data updates every {refreshInterval / 1000}s • Last update: {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Plots Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📊 Farm Plots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farm.plots?.map((plot) => (
              <FarmPlotCard
                key={plot.id}
                plot={plot}
                SOIL_TYPE_OPTIONS={SOIL_TYPE_OPTIONS}
                exportPredictionsToCSV={exportPredictionsToCSV}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmDetailPage; 