# 🌾 Digital Twin Farm Management System

A modern, full-stack **Farm Management System** integrating a **Digital Twin** of the farm environment and **ML-powered predictions** to support data-driven agricultural decisions.

---

## 🌐 What is a Digital Twin Farm?

The **Digital Twin** in this project is a virtual replica of a real-world farm — capturing live and historical data on **soil**, **crop health**, **weather**, and **resource usage**. It enables real-time simulation and decision-making by mirroring the physical environment.

---

## 🧠 Key Features

- 🌱 **ML-Powered Predictions**: Forecast crop yield, detect soil degradation, recommend irrigation schedules.
- 🧪 **Simulation Layer**: Experiment virtually with crop layouts, water distribution, and fertilizer plans.
- 🗂 **Data Exporting**: Export real-time or historical farm data in CSV format.
- 🖥 **Interactive Dashboard**: Responsive frontend for farmers, agronomists, and planners.
- 🔄 **Real-Time Sync**: Mirror real-world environmental and resource conditions on the twin.

---

## 🏗️ Tech Stack

| Layer        | Technologies                       |
|--------------|------------------------------------|
| Frontend     | React, Next.js                     |
| Backend      | Node.js, Express                   |
| Database     | PostgreSQL + Prisma ORM            |
| ML Service   | Python (Flask/FastAPI), scikit-learn, Pandas |
| DevOps       | Docker (optional), GitHub Actions  |
| Config       | `.env`, ESLint, Prettier           |

---

## 🤖 ML Capabilities

- **Crop Yield Forecasting**: Predict outcomes based on weather, soil, and seed type.
- **Smart Irrigation**: Predict optimal water usage based on evaporation rates and crop needs.
- **Disease Detection** *(upcoming)*: Integrate future support for vision-based plant diagnostics.

---

## 📈 Use Case Flow

1. **User Input**: Farmer logs current environmental stats through sensors(soil pH, temperature, water level).
2. **Digital Twin Sync**: Virtual farm environment updates in real time.
3. **Prediction Engine**: Backend ML service recommends actions.
4. **Simulation**: Users experiment with conditions to evaluate risks or optimizations.

---

## 📤 Outputs

- 📄 **CSV Exports** (`exported_farm_data.csv`)
- 📊 **Dashboards** with real-time metrics
- 🔁 **Simulation Logs and Forecast Reports**

---

## 📜 License

[MIT License](LICENSE)

---

## 🤝 Contributions

Pull requests are welcome! Please open an issue first to discuss major changes.
