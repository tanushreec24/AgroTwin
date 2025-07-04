"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var crops, cropList, farms, farmList, plotCount, _i, farmList_1, farm, i, plotList, sensorTypes, sensorCount, _a, plotList_1, plot, _b, sensorTypes_1, type, sensorList, now, readings, _c, sensorList_1, sensor, d, timestamp, batchSize, i, _d, plotList_2, plot;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log('🌱 Seeding database...');
                    return [4 /*yield*/, prisma.crop.createMany({
                            data: [
                                { name: 'Wheat', variety: 'Hard Red', description: 'Winter wheat' },
                                { name: 'Corn', variety: 'Sweet', description: 'Sweet corn' },
                                { name: 'Soybean', variety: 'Glycine max', description: 'High protein' },
                            ],
                            skipDuplicates: true,
                        })];
                case 1:
                    crops = _e.sent();
                    return [4 /*yield*/, prisma.crop.findMany()];
                case 2:
                    cropList = _e.sent();
                    return [4 /*yield*/, prisma.farm.createMany({
                            data: [
                                { name: 'Green Valley' },
                                { name: 'Sunny Acres' },
                            ],
                            skipDuplicates: true,
                        })];
                case 3:
                    farms = _e.sent();
                    return [4 /*yield*/, prisma.farm.findMany()];
                case 4:
                    farmList = _e.sent();
                    plotCount = 0;
                    _i = 0, farmList_1 = farmList;
                    _e.label = 5;
                case 5:
                    if (!(_i < farmList_1.length)) return [3 /*break*/, 10];
                    farm = farmList_1[_i];
                    i = 0;
                    _e.label = 6;
                case 6:
                    if (!(i < 5)) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.plot.create({
                            data: {
                                farmId: farm.id,
                                cropId: cropList[i % cropList.length].id,
                                row: i,
                                column: i,
                                areaSqM: 1000 + i * 100,
                            },
                        })];
                case 7:
                    _e.sent();
                    plotCount++;
                    _e.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 6];
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10: return [4 /*yield*/, prisma.plot.findMany()];
                case 11:
                    plotList = _e.sent();
                    sensorTypes = [
                        'Temperature', 'Humidity', 'SoilMoisture', 'SoilN', 'SoilP', 'SoilK', 'Chlorophyll',
                    ];
                    sensorCount = 0;
                    _a = 0, plotList_1 = plotList;
                    _e.label = 12;
                case 12:
                    if (!(_a < plotList_1.length)) return [3 /*break*/, 17];
                    plot = plotList_1[_a];
                    _b = 0, sensorTypes_1 = sensorTypes;
                    _e.label = 13;
                case 13:
                    if (!(_b < sensorTypes_1.length)) return [3 /*break*/, 16];
                    type = sensorTypes_1[_b];
                    return [4 /*yield*/, prisma.sensor.create({
                            data: {
                                type: type,
                                name: "".concat(type, " Sensor for Plot ").concat(plot.id),
                                plotId: plot.id,
                                installedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
                            },
                        })];
                case 14:
                    _e.sent();
                    sensorCount++;
                    _e.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 13];
                case 16:
                    _a++;
                    return [3 /*break*/, 12];
                case 17: return [4 /*yield*/, prisma.sensor.findMany()];
                case 18:
                    sensorList = _e.sent();
                    now = new Date();
                    readings = [];
                    for (_c = 0, sensorList_1 = sensorList; _c < sensorList_1.length; _c++) {
                        sensor = sensorList_1[_c];
                        for (d = 0; d < 7 * 24; d++) { // 7 days, hourly
                            timestamp = new Date(now.getTime() - d * 60 * 60 * 1000);
                            readings.push({
                                sensorId: sensor.id,
                                plotId: sensor.plotId,
                                value: Math.random() * 100, // Simulated value
                                timestamp: timestamp,
                            });
                        }
                    }
                    batchSize = 1000;
                    i = 0;
                    _e.label = 19;
                case 19:
                    if (!(i < readings.length)) return [3 /*break*/, 22];
                    return [4 /*yield*/, prisma.sensorReading.createMany({
                            data: readings.slice(i, i + batchSize),
                        })];
                case 20:
                    _e.sent();
                    console.log("Inserted ".concat(Math.min(i + batchSize, readings.length), " / ").concat(readings.length, " readings"));
                    _e.label = 21;
                case 21:
                    i += batchSize;
                    return [3 /*break*/, 19];
                case 22:
                    _d = 0, plotList_2 = plotList;
                    _e.label = 23;
                case 23:
                    if (!(_d < plotList_2.length)) return [3 /*break*/, 26];
                    plot = plotList_2[_d];
                    return [4 /*yield*/, prisma.action.create({
                            data: {
                                plotId: plot.id,
                                type: 'Irrigation',
                                description: 'Initial irrigation',
                                performedBy: 'System',
                                performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
                            },
                        })];
                case 24:
                    _e.sent();
                    _e.label = 25;
                case 25:
                    _d++;
                    return [3 /*break*/, 23];
                case 26:
                    console.log('✅ Seeding complete!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
