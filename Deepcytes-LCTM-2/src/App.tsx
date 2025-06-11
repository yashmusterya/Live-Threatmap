import React, { useState, useEffect, useRef } from "react";
import { Shield, AlertCircle } from "lucide-react";
import WorldMap from "./components/WorldMap";
import AttackInfo from "./components/AttackInfo";
import LogoDC from "./Image/logo_DC.png";
import Controls from "./components/Controls";
import Stats from "./components/Stats";
import {
  Attack,
  AttackType,
  AttackSeverity,
  Country,
  MaliciousIP,
} from "./types";
import { generateRandomAttack } from "./data/attacks";
import {
  generateRandomMaliciousIP,
  generateInitialMaliciousIPs,
  startMaliciousIPSSEConnection,
  stopMaliciousIPSSEConnection,
} from "./data/maliciousIPs";
import News from "./components/news";

function App() {
  const [maliciousIPs, setMaliciousIPs] = useState<MaliciousIP[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<AttackType[]>([
    AttackType.MALWARE,
    AttackType.PHISHING,
    AttackType.DDOS,
  ]);
  const [selectedSeverities, setSelectedSeverities] = useState<
    AttackSeverity[]
  >([
    AttackSeverity.LOW,
    AttackSeverity.MEDIUM,
    AttackSeverity.HIGH,
    AttackSeverity.CRITICAL,
  ]);
  const [attackDetails, setAttackDetails] = useState<Attack[]>([]); // Only for display in attack details panel
  const [currentAttacks, setCurrentAttacks] = useState<Attack[]>([]); // Current attacks being rendered on map

  const maliciousIPSSERef = useRef<EventSource | null>(null);

  // Generate random attacks every second
  useEffect(() => {
    const generateRandomAttacks = () => {
      // Generate 2-5 random attacks
      const numAttacks = Math.floor(Math.random() * 4) + 2;
      const newAttacks = Array.from({ length: numAttacks }, () =>
        generateRandomAttack()
      );

      // Apply filters and add valid attacks
      const validAttacks = newAttacks.filter(
        (attack) =>
          selectedTypes.includes(attack.type) &&
          selectedSeverities.includes(attack.severity) &&
          attack.source.code !== "UNK" && // Filter out unknown source
          attack.target.code !== "UNK" && // Filter out unknown target
          attack.source.latitude !== 0 && // Ensure source coordinates are valid
          attack.source.longitude !== 0 &&
          attack.target.latitude !== 0 && // Ensure target coordinates are valid
          attack.target.longitude !== 0
      );

      // Set current attacks for map display
      setCurrentAttacks(validAttacks);

      // Update attack details for display panel
      setAttackDetails((prev) => {
        const updated = [...prev, ...validAttacks];
        return updated.slice(-10); // Keep only last 10 attacks for display
      });
    };

    // Set up interval for random attack generation
    const intervalId = setInterval(generateRandomAttacks, 1000);

    return () => clearInterval(intervalId);
  }, [selectedTypes, selectedSeverities]);

  // Handle malicious IPs with SSE
  useEffect(() => {
    // Start SSE connection for malicious IPs
    maliciousIPSSERef.current = startMaliciousIPSSEConnection(
      (ip) => {
        setMaliciousIPs((prev) => {
          const newIPs = [...prev, ip];
          // Keep only the last 50 IPs
          return newIPs.slice(-50);
        });
      },
      (error) => {
        console.error("Malicious IP SSE Error:", error);
      }
    );

    return () => {
      if (maliciousIPSSERef.current) {
        stopMaliciousIPSSEConnection(maliciousIPSSERef.current);
        maliciousIPSSERef.current = null;
      }
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111827] text-white">
      {/* Header */}
      <header className="bg-[#000129] py-4 border-b border-gray-700 h-14">
        <div className="container mx-auto relative h-full flex items-center justify-between">
          <div className="flex items-center">
            <img src={LogoDC} alt="Cyber Shield" className="h-13 w-14" />
          </div>
          <h1 className="text-3xl font-bold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white">
            Live Cyber Threat Map
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Stats attacks={attackDetails} />
            <News />

            {hoveredCountry && (
              <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                <h3 className="font-medium mb-2">{hoveredCountry.name}</h3>
                <div className="text-sm text-gray-400">
                  <p>Lat: {hoveredCountry.latitude.toFixed(2)}</p>
                  <p>Long: {hoveredCountry.longitude.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main map area */}
          <div
            ref={containerRef}
            className="lg:col-span-2 bg-[#111827] rounded-lg overflow-hidden relative"
            style={{ height: "70vh", minHeight: "500px" }}
          >
            <WorldMap
              width={dimensions.width}
              height={dimensions.height}
              onCountryHover={setHoveredCountry}
              maliciousIPs={maliciousIPs}
              attacks={currentAttacks}
            />
          </div>

          <div className="lg:col-span-1 space-y-4">
            {/* Recent attacks list */}
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
              <h3 className="font-bold mb-3">Attack Details</h3>
              <div className="space-y-2 max-h-800 overflow-y-auto">
                {attackDetails
                  .slice(-10)
                  .reverse()
                  .map((attack) => (
                    <div
                      key={attack.id}
                      className="p-2 bg-gray-700 bg-opacity-50 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {attack.source.name} → {attack.target.name}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            attack.severity === AttackSeverity.CRITICAL
                              ? "bg-red-900 text-red-200"
                              : attack.severity === AttackSeverity.HIGH
                              ? "bg-orange-900 text-orange-200"
                              : attack.severity === AttackSeverity.MEDIUM
                              ? "bg-yellow-900 text-yellow-200"
                              : attack.severity === AttackSeverity.LOW
                              ? "bg-blue-900 text-blue-200"
                              : "bg-purple-900 text-purple-200"
                          }`}
                        >
                          {attack.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex justify-between mt-1">
                        <span>{attack.type}</span>
                        <span>
                          {new Date(attack.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
