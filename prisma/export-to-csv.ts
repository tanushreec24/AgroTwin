const { PrismaClient, ActionType } = require('@prisma/client');
const fs = require('fs');
const { parse } = require('json2csv');

const prisma = new PrismaClient();

async function main() {
  // Query plots with related farm, crop, and latest sensor readings
  const plots = await prisma.plot.findMany({
    include: {
      farm: true,
      crop: true,
      sensors: {
        include: {
          readings: {
            orderBy: { timestamp: 'desc' },
            take: 1, // latest reading
          },
        },
      },
      actions: true, // if you want to include irrigation actions
    },
  });

  // Collect all unique sensor types
  const allSensorTypes = new Set();
  plots.forEach(plot => {
    plot.sensors.forEach(sensor => {
      allSensorTypes.add(sensor.type);
    });
  });
  const sensorTypeList = Array.from(allSensorTypes);

  // Flatten and map data for CSV
  const rows = plots.map(plot => {
    // Get latest readings for each sensor type
    const readings = {};
    plot.sensors.forEach(sensor => {
      if (sensor.readings.length > 0) {
        readings[sensor.type] = sensor.readings[0].value;
      }
    });

    // Find irrigation action if available
    const irrigationAction = plot.actions.find(a => a.type === ActionType.Irrigation);

    // Build row with all sensor types as columns
    const row = {
      farm_name: plot.farm.name,
      state: plot.farm.state,
      district: plot.farm.district,
      plot_id: plot.id,
      crop: plot.crop?.commonName || plot.crop?.name,
      areaSqM: plot.areaSqM,
      soil_type: plot.soilType,
      // yield: plot.actualYield, // Uncomment if available
      // irrigation_applied: irrigationAction?.amount, // Uncomment if available
    };
    sensorTypeList.forEach(type => {
      row[type] = readings[type];
    });
    return row;
  });

  // Convert to CSV
  const csv = parse(rows);

  // Write to file
  fs.writeFileSync('exported_farm_data.csv', csv);
  console.log('Exported to exported_farm_data.csv');
}

main().finally(() => prisma.$disconnect()); 