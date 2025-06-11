import React from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { Country, MaliciousIP, Attack } from "../types";
import { countries } from "../data/countries";
import AttackVector from "./AttackVector";

interface WorldMapProps {
  width: number;
  height: number;
  onCountryHover?: (country: Country | null) => void;
  maliciousIPs: MaliciousIP[];
  attacks: Attack[];
}

const WorldMap: React.FC<WorldMapProps> = ({
  width,
  height,
  onCountryHover,
  maliciousIPs,
  attacks,
}) => {
  const handleCountryHover = (geo: any) => {
    if (geo) {
      const country = countries.find((c) => c.code === geo.properties.iso_a2);
      onCountryHover?.(country || null);
    } else {
      onCountryHover?.(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#111827] rounded-lg overflow-hidden top-32">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: width / 2.01 / Math.PI,
          center: [0, 0],
        }}
        width={width}
        height={height}
        style={{
          backgroundColor: "#111827",
        }}
      >
        <ZoomableGroup>
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
            {({ geographies }) =>
              geographies
                .filter((geo) => geo.properties.name !== "Antarctica")
                .map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => handleCountryHover(geo)}
                    onMouseLeave={() => handleCountryHover(null)}
                    style={{
                      default: {
                        fill: "#1E293B",
                        stroke: "#334155",
                        strokeWidth: 0.75,
                        outline: "none",
                        transition: "all 250ms",
                      },
                      hover: {
                        fill: "#2D3B4F",
                        stroke: "#475569",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#334155",
                        stroke: "#64748B",
                        strokeWidth: 1,
                        outline: "none",
                      },
                    }}
                  />
                ))
            }
          </Geographies>

          {/* Attack Vectors */}
          {attacks.map((attack) => (
            <AttackVector
              key={attack.id}
              attack={attack}
              onComplete={() => {}} // No need to handle completion since vectors are not stored
            />
          ))}

          {/* Malicious IP Markers */}
          {maliciousIPs.map((ip, index) => (
            <Marker
              key={`${ip.latitude}-${ip.longitude}-${index}`}
              coordinates={[ip.longitude, ip.latitude]}
            >
              <circle
                r={2.5}
                fill="#EF4444"
                stroke="#FCA5A5"
                strokeWidth={0.5}
                style={{
                  filter: "drop-shadow(0 0 6px #EF4444)",
                  transition: "all 250ms",
                }}
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default WorldMap;
