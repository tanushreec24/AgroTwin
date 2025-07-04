import { ArrowRight, Leaf, BarChart3, Activity } from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <main className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🌾 Digital Twin Agriculture
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Real-time monitoring and simulation for Indian farms
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/70 rounded-lg p-4">
              <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Smart Farming</h3>
              <p className="text-sm text-gray-600">IoT sensors & crop monitoring</p>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Data Analytics</h3>
              <p className="text-sm text-gray-600">Real-time insights & predictions</p>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold">Live Monitoring</h3>
              <p className="text-sm text-gray-600">24/7 farm surveillance</p>
            </div>
          </div>
        </div>

        <Link href="/dashboard" prefetch={true}>
          <Button className="pointer-events-auto cursor-pointer bg-green-600 px-8 py-6 text-lg text-white hover:bg-green-700 transition-colors">
            View Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        
        <p className="text-sm text-gray-500 mt-4">
          Access real-time sensor data, farm analytics, and digital twin simulation
        </p>
      </main>
    </div>
  );
}
