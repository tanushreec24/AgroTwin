"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../trpc/react";
import Link from "next/link";
import { Home, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";

const DashboardPage = () => {
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [selectedFarmId, setSelectedFarmId] = useState<string | undefined>(undefined);

  // Fetch all farms
  const { data: farms, isLoading: farmsLoading } = api.farm.getAllFarms.useQuery();
  // Fetch all crops, sensors, actions for summary stats
  const { data: crops, isLoading: cropsLoading } = api.crop.getAllCrops.useQuery();
  const { data: sensors, isLoading: sensorsLoading } = api.sensor.getAllSensors.useQuery();
  const { data: actions, isLoading: actionsLoading } = api.action.getAllActions.useQuery();

  // Set default to first farm when loaded
  useEffect(() => {
    if (!selectedFarmId && farms && farms.length > 0) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Fetch live sensor readings with auto-refresh
  const { data: liveReadings, refetch: refetchLiveReadings } = api.sensorReading.getLiveReadings.useQuery(
    selectedFarmId ? { farmId: selectedFarmId, limit: 30 } : { limit: 30 }
  );

  // Auto-refresh live data
  useEffect(() => {
    const interval = setInterval(() => {
      refetchLiveReadings();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refetchLiveReadings]);

  const handleReloadModels = async () => {
    toast("Reloading ML models...");
    try {
      const res = await fetch("/api/reload-models", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Models reloaded successfully!");
      } else {
        toast.error(data.message || "Failed to reload models.");
      }
    } catch (e) {
      toast.error("Network error.");
    }
  };

  if (farmsLoading || cropsLoading || sensorsLoading || actionsLoading) {
    return <div>Loading dashboard...</div>;
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
              <div className="flex items-center space-x-2 text-green-600">
                <BarChart3 className="h-5 w-5" />
                <span className="font-semibold">Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Digital Twin Agriculture</span>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors" onClick={handleReloadModels}>
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Digital Twin Dashboard (India)</h1>
        
        <div className="mb-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Farms</div>
              <div className="text-2xl">{farms?.length ?? 0}</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Crops</div>
              <div className="text-2xl">{crops?.length ?? 0}</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Sensors</div>
              <div className="text-2xl">{sensors?.length ?? 0}</div>
            </div>
            <div className="bg-white rounded shadow p-4">
              <div className="text-lg font-semibold">Actions</div>
              <div className="text-2xl">{actions?.length ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Live Sensor Monitoring */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">🌡️ Live Sensor Monitoring</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="farm-select" className="text-sm text-gray-600">Farm:</label>
              <select
                id="farm-select"
                value={selectedFarmId}
                onChange={e => setSelectedFarmId(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {farms?.map(farm => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} {farm.state ? `(${farm.state})` : ""}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600 ml-2">Refresh:</span>
              <select
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveReadings?.slice(0, 12).map((reading) => (
                <div key={reading.id} className="border rounded p-3 bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">{reading.sensor.name}</div>
                      <div className="text-xs text-gray-600">
                        {reading.plot.farm.name} - {reading.plot.farm.state}
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
                  <div className="mt-2 text-xs text-gray-500">
                    Plot: {reading.plot.crop?.name || 'Unknown Crop'}
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

        <h2 className="text-2xl font-bold mb-4">Farms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms && farms.length > 0 ? (
            farms.map((farm) => (
              <Link key={farm.id} href={`/farm/${farm.id}`} className="block">
                <div className="bg-white rounded shadow p-4 hover:shadow-lg transition-shadow cursor-pointer border border-transparent hover:border-green-200">
                  <div className="text-xl font-semibold mb-2">{farm.name}</div>
                  <div className="text-gray-600">{farm.state || "Unknown State"}, {farm.district || "Unknown District"}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    Plots: {farm.plots?.length ?? 0} | Sensors: {farm.plots?.reduce((total, plot) => total + (plot.sensors?.length ?? 0), 0) ?? 0}
                  </div>
                  <div className="mt-3 text-sm text-green-600 font-medium">
                    Click to view details →
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div>No farms found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 