import { PrismaClient, SensorType, ActionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Crops
  const crops = await prisma.crop.createMany({
    data: [
      { name: 'Wheat', variety: 'Hard Red', description: 'Winter wheat' },
      { name: 'Corn', variety: 'Sweet', description: 'Sweet corn' },
      { name: 'Soybean', variety: 'Glycine max', description: 'High protein' },
    ],
    skipDuplicates: true,
  });
  const cropList = await prisma.crop.findMany();

  // 2. Create Farms
  const farms = await prisma.farm.createMany({
    data: [
      { name: 'Green Valley' },
      { name: 'Sunny Acres' },
    ],
    skipDuplicates: true,
  });
  const farmList = await prisma.farm.findMany();

  // 3. Create Plots for each farm
  let plotCount = 0;
  for (const farm of farmList) {
    for (let i = 0; i < 5; i++) {
      await prisma.plot.create({
        data: {
          farmId: farm.id,
          cropId: cropList[i % cropList.length].id,
          row: i,
          column: i,
          areaSqM: 1000 + i * 100,
        },
      });
      plotCount++;
    }
  }
  const plotList = await prisma.plot.findMany();

  // 4. Create Sensors for each plot
  const sensorTypes: SensorType[] = [
    'Temperature', 'Humidity', 'SoilMoisture', 'SoilN', 'SoilP', 'SoilK', 'Chlorophyll',
  ];
  let sensorCount = 0;
  for (const plot of plotList) {
    for (const type of sensorTypes) {
      await prisma.sensor.create({
        data: {
          type,
          name: `${type} Sensor for Plot ${plot.id}`,
          plotId: plot.id,
          installedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        },
      });
      sensorCount++;
    }
  }
  const sensorList = await prisma.sensor.findMany();

  // 5. Simulate Sensor Readings (last 7 days, every hour)
  const now = new Date();
  const readings: any[] = [];
  for (const sensor of sensorList) {
    for (let d = 0; d < 7 * 24; d++) { // 7 days, hourly
      const timestamp = new Date(now.getTime() - d * 60 * 60 * 1000);
      readings.push({
        sensorId: sensor.id,
        plotId: sensor.plotId,
        value: Math.random() * 100, // Simulated value
        timestamp,
      });
    }
  }
  // Insert in batches for performance
  const batchSize = 1000;
  for (let i = 0; i < readings.length; i += batchSize) {
    await prisma.sensorReading.createMany({
      data: readings.slice(i, i + batchSize),
    });
    console.log(`Inserted ${Math.min(i + batchSize, readings.length)} / ${readings.length} readings`);
  }

  // 6. Create Actions for each plot
  for (const plot of plotList) {
    await prisma.action.create({
      data: {
        plotId: plot.id,
        type: 'Irrigation',
        description: 'Initial irrigation',
        performedBy: 'System',
        performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 