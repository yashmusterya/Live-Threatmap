import React, { useEffect, useRef } from "react";
import { Line } from "react-simple-maps";
import { Attack, AttackSeverity } from "../types";
import gsap from "gsap";

interface AttackVectorProps {
  attack: Attack;
  onComplete?: () => void;
}

const getSeverityColor = (severity: AttackSeverity): string => {
  switch (severity) {
    case AttackSeverity.CRITICAL:
      return "#ef4444";
    case AttackSeverity.HIGH:
      return "#f97316";
    case AttackSeverity.MEDIUM:
      return "#eab308";
    case AttackSeverity.LOW:
      return "#22c55e";
    default:
      return "#a855f7";
  }
};

const AttackVector: React.FC<AttackVectorProps> = ({ attack, onComplete }) => {
  const color = getSeverityColor(attack.severity);
  const lineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    if (!lineRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => onComplete?.(),
    });

    gsap.set(lineRef.current, {
      strokeDasharray: "100%",
      strokeDashoffset: "100%",
      opacity: 0,
    });

    tl.to(lineRef.current, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "power2.inOut",
      opacity: 1,
    }).to(
      lineRef.current,
      {
        opacity: 0,
        duration: 0.3,
      },
      "+=0.2"
    );

    return () => {
      tl.kill();
    };
  }, [attack.id, onComplete]);

  // Calculate the shortest path between two points accounting for world wraparound
  const calculateShortestPath = (sourceLng: number, targetLng: number) => {
    // Normalize longitudes to [-180, 180]
    const normSource = ((((sourceLng + 180) % 360) + 360) % 360) - 180;
    const normTarget = ((((targetLng + 180) % 360) + 360) % 360) - 180;

    // Calculate the shortest distance
    const diff = normTarget - normSource;
    const absDiff = Math.abs(diff);

    if (absDiff <= 180) {
      // Direct path is shortest
      return [normSource, normTarget];
    } else {
      // Path through the antimeridian is shortest
      if (diff > 0) {
        // Target is east of source - go west around the world
        return [normSource, normTarget - 360];
      } else {
        // Target is west of source - go east around the world
        return [normSource, normTarget + 360];
      }
    }
  };

  // Get the shortest path coordinates
  const [fromLng, toLng] = calculateShortestPath(
    attack.source.longitude,
    attack.target.longitude
  );

  return (
    <Line
      ref={lineRef as any}
      from={[fromLng, attack.source.latitude]}
      to={[toLng, attack.target.latitude]}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray="100%"
      strokeDashoffset="100%"
      style={{
        // filter: `drop-shadow(0 0 8px ${color})`,
        opacity: 0,
      }}
    />
  );
};

export default AttackVector;
