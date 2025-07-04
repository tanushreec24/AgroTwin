const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting non-destructive, upsert-based database seeding...');

  // 1. Upsert Crops (major Indian crops)
  const cropsData = [
    { commonName: 'Basmati Rice', name: 'Oryza sativa', variety: 'Pusa Basmati', description: 'Premium aromatic rice, Kharif' },
    { commonName: 'Sona Masuri Rice', name: 'Oryza sativa', variety: 'Sona Masuri', description: 'Popular South Indian rice, Kharif' },
    { commonName: 'Wheat', name: 'Triticum aestivum', variety: 'HD 2967', description: 'High-yielding wheat, Rabi' },
    { commonName: 'Sugarcane', name: 'Saccharum officinarum', variety: 'Co 0238', description: 'High-sucrose sugarcane' },
    { commonName: 'Cotton', name: 'Gossypium hirsutum', variety: 'Bt Cotton', description: 'Genetically modified cotton' },
    { commonName: 'Maize', name: 'Zea mays', variety: 'HQPM-1', description: 'Hybrid maize, Kharif/Rabi' },
    { commonName: 'Pigeon Pea', name: 'Cajanus cajan', variety: 'ICPL 87119', description: 'Arhar/Tur dal, Kharif' },
    { commonName: 'Chickpea', name: 'Cicer arietinum', variety: 'JG 11', description: 'Bengal gram, Rabi' },
    { commonName: 'Groundnut', name: 'Arachis hypogaea', variety: 'TMV 2', description: 'Peanut, Kharif' },
    { commonName: 'Soybean', name: 'Glycine max', variety: 'JS 335', description: 'Soybean, Kharif' },
    { commonName: 'Pearl Millet', name: 'Pennisetum glaucum', variety: 'HHB 67', description: 'Bajra, Kharif' },
    { commonName: 'Sorghum', name: 'Sorghum bicolor', variety: 'CSH 16', description: 'Jowar, Kharif' },
    { commonName: 'Finger Millet', name: 'Eleusine coracana', variety: 'GPU 28', description: 'Ragi, Kharif' },
    { commonName: 'Mustard', name: 'Brassica juncea', variety: 'Pusa Bold', description: 'Rai/Sarson, Rabi' },
    { commonName: 'Sunflower', name: 'Helianthus annuus', variety: 'KBSH 44', description: 'Sunflower, Kharif/Rabi' },
    { commonName: 'Potato', name: 'Solanum tuberosum', variety: 'Kufri Pukhraj', description: 'Potato, Rabi' },
    { commonName: 'Onion', name: 'Allium cepa', variety: 'Agrifound Dark Red', description: 'Onion, Rabi' },
    { commonName: 'Tomato', name: 'Solanum lycopersicum', variety: 'Pusa Ruby', description: 'Tomato, Kharif/Rabi' },
    { commonName: 'Chilli', name: 'Capsicum annuum', variety: 'Pusa Jwala', description: 'Chilli, Kharif' },
    { commonName: 'Brinjal', name: 'Solanum melongena', variety: 'Pusa Purple Long', description: 'Eggplant, Kharif' },
  ];

  for (const crop of cropsData) {
    await prisma.crop.upsert({
      where: { commonName: crop.commonName },
      update: { ...crop },
      create: { ...crop },
    });
  }
  const cropList = await prisma.crop.findMany();

  // 2. Upsert Farms (with state and district)
  const farmsData = [
    { name: 'Farm A', state: 'Punjab', district: 'Ludhiana' },
    { name: 'Farm B', state: 'Karnataka', district: 'Mandya' },
    { name: 'Farm C', state: 'Tamil Nadu', district: 'Thanjavur' },
    { name: 'Farm D', state: 'Maharashtra', district: 'Nagpur' },
    { name: 'Farm E', state: 'Uttar Pradesh', district: 'Meerut' },
    { name: 'Farm F', state: 'West Bengal', district: 'Bardhaman' },
    { name: 'Farm G', state: 'Gujarat', district: 'Junagadh' },
    { name: 'Farm H', state: 'Madhya Pradesh', district: 'Indore' },
    { name: 'Farm I', state: 'Rajasthan', district: 'Jodhpur' },
    { name: 'Farm J', state: 'Andhra Pradesh', district: 'Guntur' },
    { name: 'Farm K', state: 'Telangana', district: 'Warangal' },
    { name: 'Farm L', state: 'Bihar', district: 'Bhagalpur' },
    { name: 'Farm M', state: 'Odisha', district: 'Cuttack' },
    { name: 'Farm N', state: 'Assam', district: 'Dibrugarh' },
    { name: 'Farm O', state: 'Haryana', district: 'Karnal' },
    { name: 'Farm P', state: 'Jharkhand', district: 'Ranchi' },
    { name: 'Farm Q', state: 'Chhattisgarh', district: 'Raipur' },
    { name: 'Farm R', state: 'Uttarakhand', district: 'Dehradun' },
    { name: 'Farm S', state: 'Himachal Pradesh', district: 'Shimla' },
    { name: 'Farm T', state: 'Jammu and Kashmir', district: 'Pulwama' },
    { name: 'Farm U', state: 'Goa', district: 'North Goa' },
    { name: 'Farm V', state: 'Kerala', district: 'Idukki' },
    { name: 'Farm W', state: 'Manipur', district: 'Imphal East' },
    { name: 'Farm X', state: 'Mizoram', district: 'Aizawl' },
    { name: 'Farm Y', state: 'Nagaland', district: 'Kohima' },
    { name: 'Farm Z', state: 'Tripura', district: 'West Tripura' },
    { name: 'Farm AA', state: 'Arunachal Pradesh', district: 'Papum Pare' },
    { name: 'Farm AB', state: 'Sikkim', district: 'East Sikkim' },
    { name: 'Farm AC', state: 'Meghalaya', district: 'East Khasi Hills' },
  ];

  let farmList = [];
  for (const farm of farmsData) {
    const upserted = await prisma.farm.upsert({
      where: { name_state_district: { name: farm.name, state: farm.state, district: farm.district } },
      update: { ...farm },
      create: { ...farm },
    });
    farmList.push(upserted);
  }

  // 3. Ensure each farm has 5 plots (by farmId, row, column)
  for (const farm of farmList) {
    const existingPlots = await prisma.plot.findMany({ where: { farmId: farm.id } });
    for (let i = 0; i < 5; i++) {
      const plotExists = existingPlots.find(p => p.row === i && p.column === i);
      if (!plotExists) {
        await prisma.plot.create({
          data: {
            farmId: farm.id,
            cropId: cropList[(i + farmList.indexOf(farm)) % cropList.length].id,
            row: i,
            column: i,
            areaSqM: 1000 + i * 100,
          },
        });
      }
    }
  }

  // 4. Upsert sensors for each plot (by plotId+type)
  const sensorTypes = [
    'Temperature',
    'Humidity',
    'Rainfall',
    'SolarRadiation',
    'SoilMoisture',
    'SoilN',
    'SoilP',
    'SoilK',
    'SoilPH',
  ];

  for (const farm of farmList) {
    const plots = await prisma.plot.findMany({ where: { farmId: farm.id } });
    for (const plot of plots) {
      for (const sensorType of sensorTypes) {
        await prisma.sensor.upsert({
          where: {
            // You must have a unique constraint on (plotId, type) in your Prisma schema for this to work
            plotId_type: {
              plotId: plot.id,
              type: sensorType,
            },
          },
          update: {
            name: `${sensorType} Sensor for Plot ${plot.id.slice(-4)}`,
            location: `Plot ${plot.id.slice(-4)}`,
          },
          create: {
            plotId: plot.id,
            type: sensorType,
            name: `${sensorType} Sensor for Plot ${plot.id.slice(-4)}`,
            location: `Plot ${plot.id.slice(-4)}`,
          },
        });
      }
    }
  }

  // 5. Upsert actions for each plot (by plotId+type)
  const actionTypes = ['Irrigation', 'Fertilization', 'Pesticide', 'Harvesting', 'Planting'];
  for (const farm of farmList) {
    const plots = await prisma.plot.findMany({ where: { farmId: farm.id } });
    for (const plot of plots) {
      for (let i = 0; i < 3; i++) {
        const type = actionTypes[i % actionTypes.length];
        await prisma.action.upsert({
          where: {
            // You must have a unique constraint on (plotId, type) in your Prisma schema for this to work
            plotId_type: {
              plotId: plot.id,
              type,
            },
          },
          update: {
            description: `${type} operation on ${farm.name}`,
            performedBy: 'System',
            performedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
          create: {
            plotId: plot.id,
            type,
            description: `${type} operation on ${farm.name}`,
            performedBy: 'System',
            performedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  // 6. Upsert recommendations for each plot (by plotId+actionType)
  const recommendationTypes = ['Irrigation', 'Fertilization', 'Pesticide', 'Harvesting'];
  for (const farm of farmList) {
    const plots = await prisma.plot.findMany({ where: { farmId: farm.id } });
    for (const plot of plots) {
      for (let i = 0; i < 2; i++) {
        const actionType = recommendationTypes[i % recommendationTypes.length];
        await prisma.recommendation.upsert({
          where: {
            // You must have a unique constraint on (plotId, actionType) in your Prisma schema for this to work
            plotId_actionType: {
              plotId: plot.id,
              actionType,
            },
          },
          update: {
            details: `Recommendation for ${actionType} on ${farm.name}`,
            status: 'Pending',
            feedback: null,
          },
          create: {
            plotId: plot.id,
            actionType,
            details: `Recommendation for ${actionType} on ${farm.name}`,
            status: 'Pending',
            feedback: null,
          },
        });
      }
    }
  }

  console.log('✅ Upsert-based, non-destructive database seeding completed successfully!');
  console.log(`📊 Ensured: ${farmList.length} farms, 5 plots per farm, 9 sensors per plot, upserted actions and recommendations.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 