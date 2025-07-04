import React, { useState, useMemo, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { api } from '~/trpc/react';

const DEFAULT_SOIL_TYPE = "loam";

// Infer soil type from sensor readings (simple heuristic)
function inferSoilType(liveReadings) {
  if (!liveReadings) return DEFAULT_SOIL_TYPE;
  const getLatest = (type) => {
    return liveReadings.find(
      (r) => r.sensor.name.toLowerCase().includes(type)
    )?.value;
  };
  const ph = getLatest("ph");
  const moisture = getLatest("moisture");
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

const FarmPlotCard = ({ plot, SOIL_TYPE_OPTIONS, exportPredictionsToCSV }) => {
  const [soilType, setSoilType] = useState(plot.soilType || "");
  const updatePlot = api.plot.updatePlot.useMutation();
  const [isEditing, setIsEditing] = useState(false);

  // Extract latest sensor values for this plot
  const { data: plotReadings } = api.sensorReading.getLiveReadings.useQuery({ plotId: plot.id, limit: 10 });
  const getLatest = (type) => {
    return plotReadings?.find(
      (r) => r.sensor.name.toLowerCase().includes(type)
    )?.value;
  };
  const plotSoilType = plot.soilType || inferSoilType(plotReadings);

  // Per-plot predictions
  const utils = api.useUtils();
  const plotYieldPrediction = api.prediction.predictYield.useMutation({
    onSuccess: () => {
      utils.prediction.getPredictionsByPlot.invalidate({ plotId: plot.id, type: 'yield' });
    },
  });
  const plotIrrigationPrediction = api.prediction.predictIrrigation.useMutation({
    onSuccess: () => {
      utils.prediction.getPredictionsByPlot.invalidate({ plotId: plot.id, type: 'irrigation' });
    },
  });

  const { data: yieldHistory, refetch: yieldHistoryRefetch } = api.prediction.getPredictionsByPlot.useQuery({ plotId: plot.id, type: "yield" });
  const { data: irrigationHistory, refetch: irrigationHistoryRefetch } = api.prediction.getPredictionsByPlot.useQuery({ plotId: plot.id, type: "irrigation" });

  // Remove DEFAULTS for What-if fields
  const latestReading = plotReadings && plotReadings.length > 0 ? plotReadings[0] : null;
  const [whatIfRainfall, setWhatIfRainfall] = useState(latestReading && latestReading.rainfall !== undefined ? String(latestReading.rainfall) : "");
  const [whatIfTemperature, setWhatIfTemperature] = useState(latestReading && latestReading.temperature !== undefined ? String(latestReading.temperature) : "");
  const [whatIfSoilMoisture, setWhatIfSoilMoisture] = useState(latestReading && latestReading.soilMoisture !== undefined ? String(latestReading.soilMoisture) : "");
  const [whatIfSoilType, setWhatIfSoilType] = useState(plot.soilType || "");
  const whatIfYield = api.prediction.predictYield.useMutation();
  const whatIfIrrigation = api.prediction.predictIrrigation.useMutation();
  const [whatIfWarning, setWhatIfWarning] = useState("");

  // Add state for date range
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter history by date range
  const filterByDate = (arr) => {
    if (!arr) return [];
    if (!dateRange.start && !dateRange.end) return arr;
    return arr.filter(item => {
      const d = new Date(item.createdAt);
      const afterStart = dateRange.start ? d >= new Date(dateRange.start) : true;
      const beforeEnd = dateRange.end ? d <= new Date(dateRange.end) : true;
      return afterStart && beforeEnd;
    });
  };
  const filteredYieldHistory = filterByDate(yieldHistory);
  const filteredIrrigationHistory = filterByDate(irrigationHistory);

  // Compute stats
  const getStats = (arr) => {
    if (!arr || arr.length === 0) return { min: '-', max: '-', avg: '-' };
    const vals = arr.map(x => x.result).filter(x => typeof x === 'number');
    if (vals.length === 0) return { min: '-', max: '-', avg: '-' };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    return { min, max, avg };
  };
  const yieldStats = getStats(filteredYieldHistory);
  const irrigationStats = getStats(filteredIrrigationHistory);

  const runWhatIf = () => {
    setWhatIfWarning("");
    // Trim and check all fields
    if (
      whatIfRainfall.trim() === "" || isNaN(Number(whatIfRainfall)) ||
      whatIfTemperature.trim() === "" || isNaN(Number(whatIfTemperature)) ||
      whatIfSoilMoisture.trim() === "" || isNaN(Number(whatIfSoilMoisture)) ||
      !whatIfSoilType.trim()
    ) {
      let msg = "";
      if (whatIfRainfall.trim() === "" || isNaN(Number(whatIfRainfall))) msg += "Rainfall must be a number. ";
      if (whatIfTemperature.trim() === "" || isNaN(Number(whatIfTemperature))) msg += "Temperature must be a number. ";
      if (whatIfSoilMoisture.trim() === "" || isNaN(Number(whatIfSoilMoisture))) msg += "Soil Moisture must be a number. ";
      if (!whatIfSoilType.trim()) msg += "Soil Type is required.";
      setWhatIfWarning(msg.trim());
      return;
    }
    whatIfYield.mutate({
      rainfall: Number(whatIfRainfall),
      temperature: Number(whatIfTemperature),
      soil_type: whatIfSoilType,
      plotId: plot.id,
    });
    whatIfIrrigation.mutate({
      soil_moisture: Number(whatIfSoilMoisture),
      rainfall: Number(whatIfRainfall),
      temperature: Number(whatIfTemperature),
      plotId: plot.id,
    });
  };

  const resetWhatIf = () => {
    setWhatIfRainfall(latestReading && latestReading.rainfall !== undefined ? String(latestReading.rainfall) : "");
    setWhatIfTemperature(latestReading && latestReading.temperature !== undefined ? String(latestReading.temperature) : "");
    setWhatIfSoilMoisture(latestReading && latestReading.soilMoisture !== undefined ? String(latestReading.soilMoisture) : "");
    setWhatIfSoilType(plot.soilType || "");
  };

  // Add a warning if required fields are missing for prediction
  const missingYieldFields = getLatest("rain") === undefined || getLatest("temp") === undefined || !plotSoilType;
  const missingIrrigationFields = getLatest("moisture") === undefined || getLatest("rain") === undefined || getLatest("temp") === undefined;

  // Add effect to auto-run main prediction when all required sensor values are present
  useEffect(() => {
    const rain = getLatest("rain");
    const temp = getLatest("temp");
    const moisture = getLatest("moisture");
    if (
      rain !== undefined &&
      temp !== undefined &&
      moisture !== undefined &&
      plot.soilType
    ) {
      // Only run if not already loading or has data
      if (!plotYieldPrediction.isLoading && !plotYieldPrediction.data) {
        plotYieldPrediction.mutate({
          rainfall: Number(rain),
          temperature: Number(temp),
          soil_type: plot.soilType,
          plotId: plot.id,
        });
      }
      if (!plotIrrigationPrediction.isLoading && !plotIrrigationPrediction.data) {
        plotIrrigationPrediction.mutate({
          soil_moisture: Number(moisture),
          rainfall: Number(rain),
          temperature: Number(temp),
          plotId: plot.id,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plot.id, plot.soilType, plotReadings]);

  // Add a function to check for missing fields
  const missingFields = [];
  if (getLatest("rain") === undefined) missingFields.push("rainfall");
  if (getLatest("temp") === undefined) missingFields.push("temperature");
  if (getLatest("moisture") === undefined) missingFields.push("soil moisture");
  if (!plot.soilType) missingFields.push("verified soil type");

  // Helper to get year and season from a date
  const getYear = (d) => new Date(d).getFullYear();
  const getSeason = (d) => {
    const month = new Date(d).getMonth() + 1;
    if (month >= 10 || month <= 3) return 'Rabi'; // Oct-Mar
    if (month >= 3 && month <= 6) return 'Zaid'; // Mar-Jun
    if (month >= 6 && month <= 10) return 'Kharif'; // Jun-Oct
    return 'Unknown';
  };

  // Extract unique years and seasons from history
  const allDates = [...(yieldHistory || []), ...(irrigationHistory || [])].map(x => x.createdAt);
  const uniqueYears = Array.from(new Set(allDates.map(getYear))).sort();
  const uniqueSeasons = ['Rabi', 'Zaid', 'Kharif'];

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');

  // Filter by year and/or season
  const filterByYearSeason = (arr, year, season) => {
    if (!arr) return [];
    return arr.filter(item => {
      const y = getYear(item.createdAt);
      const s = getSeason(item.createdAt);
      const yearMatch = year ? y === Number(year) : true;
      const seasonMatch = season ? s === season : true;
      return yearMatch && seasonMatch;
    });
  };

  const overlayData = useMemo(() => {
    // For each year/season, build a series
    const overlays = [];
    if (selectedYear) {
      overlays.push({
        label: selectedYear,
        yield: filterByYearSeason(yieldHistory, selectedYear, selectedSeason),
        irrigation: filterByYearSeason(irrigationHistory, selectedYear, selectedSeason),
        color: '#8884d8',
      });
    }
    // Optionally overlay previous years for comparison
    uniqueYears.forEach(y => {
      if (String(y) !== selectedYear) {
        overlays.push({
          label: String(y),
          yield: filterByYearSeason(yieldHistory, y, selectedSeason),
          irrigation: filterByYearSeason(irrigationHistory, y, selectedSeason),
          color: '#82ca9d',
        });
      }
    });
    return overlays;
  }, [selectedYear, selectedSeason, yieldHistory, irrigationHistory]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">Plot {plot.id.slice(-4)}</h3>
          <p className="text-sm text-gray-600">{plot.crop ? `${plot.crop.commonName || 'Unknown Crop'}${plot.crop.name && plot.crop.commonName !== plot.crop.name ? ` (${plot.crop.name})` : ''}` : 'No Crop'}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-blue-600">{plot.sensors?.length || 0}</div>
          <div className="text-xs text-gray-500">Sensors</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Area:</span>
          <span className="font-medium">{plot.areaSqM} m²</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Location:</span>
          <span className="font-medium">({plot.row}, {plot.column})</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Crop Variety:</span>
          <span className="font-medium">{plot.crop ? `${plot.crop.commonName || 'Unknown Crop'}${plot.crop.name && plot.crop.commonName !== plot.crop.name ? ` (${plot.crop.name})` : ''}` : 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-gray-600">Verified Soil Type:</span>
          {isEditing ? (
            <select
              value={soilType}
              onChange={e => setSoilType(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Select...</option>
              {SOIL_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          ) : (
            <span
              className="font-medium cursor-pointer underline text-blue-700"
              onClick={() => setIsEditing(true)}
            >
              {plot.soilType || "Not set"}
            </span>
          )}
          {isEditing && soilType && soilType !== plot.soilType && (
            <button
              className="ml-2 px-2 py-1 bg-green-600 text-white rounded text-xs"
              onClick={async () => {
                await updatePlot.mutateAsync({ id: plot.id, soilType });
                plot.soilType = soilType;
                setIsEditing(false);
              }}
            >Save</button>
          )}
        </div>
      </div>
      {/* Per-plot predictions */}
      <div className="mt-4">
        <div className="font-semibold text-green-700 mb-1">Yield Prediction</div>
        {missingFields.length > 0 && (
          <div className="text-xs text-yellow-700 mt-1">
            Cannot predict: missing {missingFields.join(", ")}. Please add sensor readings and set soil type.
          </div>
        )}
        {missingFields.length > 0 ? (
          <div className="text-xs text-yellow-700 mt-1">No prediction available.</div>
        ) : plotYieldPrediction.isLoading ? (
          <div>Predicting...</div>
        ) : plotYieldPrediction.data ? (
          <div>
            <span className="text-lg font-bold text-green-800">
              {plotYieldPrediction.data.prediction?.toFixed(2)} kg
            </span>
          </div>
        ) : (
          <div className="text-xs text-yellow-700 mt-1">No prediction available.</div>
        )}
        <div className="font-semibold text-blue-700 mt-2 mb-1">Irrigation Requirement</div>
        {missingIrrigationFields ? (
          <div className="text-xs text-yellow-700 mt-1">Missing required data for prediction.</div>
        ) : plotIrrigationPrediction.isLoading ? (
          <div>Predicting...</div>
        ) : plotIrrigationPrediction.data ? (
          <div>
            <span className="text-lg font-bold text-blue-800">
              {plotIrrigationPrediction.data.prediction?.toFixed(2)} mm
            </span>
          </div>
        ) : (
          <div className="text-gray-500">No prediction available.</div>
        )}
      </div>
      <div className="mt-4">
        <div className="font-semibold text-green-700 mb-1">Prediction History</div>
        <div className="flex gap-2 items-center mb-2">
          <label>Year:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="">All</option>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <label>Season:</label>
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}>
            <option value="">All</option>
            {uniqueSeasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            {overlayData.map((series, idx) => (
              <Line
                key={series.label + '-yield'}
                type="monotone"
                dataKey="yield"
                data={series.yield.map((y, i) => ({
                  time: new Date(y.createdAt).toLocaleDateString(),
                  yield: y.result,
                }))}
                stroke={series.color}
                name={`Yield ${series.label}`}
                dot={false}
              />
            ))}
            {overlayData.map((series, idx) => (
              <Line
                key={series.label + '-irrigation'}
                type="monotone"
                dataKey="irrigation"
                data={series.irrigation.map((y, i) => ({
                  time: new Date(y.createdAt).toLocaleDateString(),
                  irrigation: y.result,
                }))}
                stroke={series.color === '#8884d8' ? '#ff7300' : '#387908'}
                name={`Irrigation ${series.label}`}
                dot={false}
                strokeDasharray="5 2"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-8 mt-2 text-xs">
          <div>
            <div className="font-semibold">Yield (kg)</div>
            <div>Min: {yieldStats.min}</div>
            <div>Max: {yieldStats.max}</div>
            <div>Avg: {yieldStats.avg}</div>
          </div>
          <div>
            <div className="font-semibold">Irrigation (mm)</div>
            <div>Min: {irrigationStats.min}</div>
            <div>Max: {irrigationStats.max}</div>
            <div>Avg: {irrigationStats.avg}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 border-t pt-4">
        <div className="font-semibold text-purple-700 mb-1">What-if Analysis</div>
        <div className="flex flex-col gap-2 mb-2">
          <label className="flex items-center gap-2 text-sm">
            Rainfall:
            <input type="number" value={whatIfRainfall} onChange={e => setWhatIfRainfall(e.target.value)} className="border rounded px-2 py-1 w-20" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Temperature:
            <input type="number" value={whatIfTemperature} onChange={e => setWhatIfTemperature(e.target.value)} className="border rounded px-2 py-1 w-20" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Soil Moisture:
            <input type="number" value={whatIfSoilMoisture} onChange={e => setWhatIfSoilMoisture(e.target.value)} className="border rounded px-2 py-1 w-20" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            Soil Type:
            <select value={whatIfSoilType} onChange={e => setWhatIfSoilType(e.target.value)} className="border rounded px-2 py-1">
              {SOIL_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <button className="mt-2 px-2 py-1 bg-purple-600 text-white rounded text-xs w-fit" onClick={runWhatIf}>Run What-if</button>
          <button className="mt-2 px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs w-fit ml-2" onClick={resetWhatIf}>
            Reset
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            <span className="font-semibold text-green-700">Yield:</span>
            {whatIfYield.isLoading ? (
              <span className="ml-2 text-gray-500">Predicting...</span>
            ) : whatIfYield.data ? (
              <span className="ml-2 text-green-800 font-bold">{whatIfYield.data.prediction?.toFixed(2)}</span>
            ) : null}
          </div>
          <div>
            <span className="font-semibold text-blue-700">Irrigation:</span>
            {whatIfIrrigation.isLoading ? (
              <span className="ml-2 text-gray-500">Predicting...</span>
            ) : whatIfIrrigation.data ? (
              <span className="ml-2 text-blue-800 font-bold">{whatIfIrrigation.data.prediction?.toFixed(2)}</span>
            ) : null}
          </div>
        </div>
        {whatIfWarning && (
          <div className="text-xs text-yellow-700 mt-1">{whatIfWarning}</div>
        )}
      </div>
    </div>
  );
};

export default FarmPlotCard; 