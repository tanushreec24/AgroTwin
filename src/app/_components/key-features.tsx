"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Leaf, BarChart, Zap } from "lucide-react";

const features = [
  {
    icon: <BarChart className="mb-4 h-8 w-8 text-green-600" />,
    title: "AI-Powered Crop Prediction",
    shortDesc: "Forecast plant growth, yield, and health using AI.",
    longDesc:
      "Our AI models analyze historical data, weather patterns, and soil condition to provide accurate predictions for your crops. This helps you make informed decisions about planting, harvesting, and resource allocation.",
  },
  {
    icon: <Zap className="mb-4 h-8 w-8 text-green-600" />,
    title: "Interactive Digital Twin Farm",
    shortDesc: "Create a virtual model of your farm for real-time monitoring.",
    longDesc:
      "The digital twin technology allows you to create a virtual replica of your farm. This interactive model helps you visualize different scenarios, test strategies, and optimize your farm layout for maximum efficiency.",
  },
  {
    icon: <Leaf className="mb-4 h-8 w-8 text-green-600" />,
    title: "AI-Based Tips and Suggestions",
    shortDesc: "Get data-driven recommendations to enhance farm efficiency.",
    longDesc:
      "Our AI constantly analyzes your farm's data and provides personalized suggestions for improving crop health, reducing resource waste, and increasing overall farm productivity.",
  },
];

export default function KeyFeatures() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleCardClick = useCallback((index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));

    cardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h2 className="mb-8 text-center text-2xl font-bold text-green-800 sm:text-3xl">
        Key Features
      </h2>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const isActive = activeIndex === index;

          return (
            <div
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`transform rounded-lg p-4 transition-all duration-300 hover:scale-105 ${
                isActive
                  ? "border-2 border-green-500 shadow-lg"
                  : "border-transparent"
              }`}
              onClick={() => handleCardClick(index)}
            >
              <Card className="h-full overflow-hidden transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex flex-col items-center">
                    {feature.icon}
                    <h3 className="mb-4 text-xl text-green-800">
                      {feature.title}
                    </h3>
                  </CardTitle>
                  <CardDescription>
                    <p className="mb-4 text-green-700">{feature.shortDesc}</p>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isActive ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <p className="text-green-600">{feature.longDesc}</p>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}
