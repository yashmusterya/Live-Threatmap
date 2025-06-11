import { v4 as uuidv4 } from "uuid";
import { MaliciousIP, AttackSeverity } from "../types";

// Generate a random IP address
const generateRandomIP = (): string => {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(
    "."
  );
};

// Generate a random timestamp within the last 24 hours
const getRandomTimestamp = (): Date => {
  const now = new Date();
  const pastHours = Math.floor(Math.random() * 24);
  const pastMinutes = Math.floor(Math.random() * 60);
  const pastSeconds = Math.floor(Math.random() * 60);

  return new Date(
    now.getTime() -
      pastHours * 60 * 60 * 1000 -
      pastMinutes * 60 * 1000 -
      pastSeconds * 1000
  );
};

// Generate random coordinates within reasonable bounds
const generateRandomCoordinates = () => {
  return {
    latitude: Math.random() * 180 - 90, // -90 to 90
    longitude: Math.random() * 360 - 180, // -180 to 180
  };
};

// Generate a random severity
const getRandomSeverity = (): AttackSeverity => {
  const severities = Object.values(AttackSeverity);
  return severities[Math.floor(Math.random() * severities.length)];
};

// Generate a single random malicious IP
export const generateRandomMaliciousIP = (): MaliciousIP => {
  const { latitude, longitude } = generateRandomCoordinates();

  return {
    id: uuidv4(),
    ip: generateRandomIP(),
    latitude,
    longitude,
    timestamp: getRandomTimestamp(),
    severity: getRandomSeverity(),
  };
};

// Generate initial set of malicious IPs
export const generateInitialMaliciousIPs = (count: number): MaliciousIP[] => {
  const ips: MaliciousIP[] = [];

  for (let i = 0; i < count; i++) {
    ips.push(generateRandomMaliciousIP());
  }

  return ips;
};

// Interface for raw SSE data
interface RawSSEMaliciousIP {
  source: string;
  data: {
    ip: string;
    latitude: number | null;
    longitude: number | null;
    type: string;
  };
}

// Convert raw SSE data to our MaliciousIP type
const convertSSEToMaliciousIP = (rawIP: RawSSEMaliciousIP): MaliciousIP => {
  // Helper function to map severity string to enum
  const mapSeverity = (type: string): AttackSeverity => {
    const severityMap: { [key: string]: AttackSeverity } = {
      alienvault: AttackSeverity.HIGH,
      default: AttackSeverity.MEDIUM,
    };
    return severityMap[type] || AttackSeverity.MEDIUM;
  };

  return {
    id: uuidv4(),
    ip: rawIP.data.ip,
    latitude: rawIP.data.latitude || 0,
    longitude: rawIP.data.longitude || 0,
    timestamp: new Date(),
    severity: mapSeverity(rawIP.data.type),
  };
};

// Function to start SSE connection for malicious IPs
export const startMaliciousIPSSEConnection = (
  onIP: (ip: MaliciousIP) => void,
  onError: (error: Event) => void
): EventSource => {
  const eventSource = new EventSource("http://localhost:8000/malicious-ips");

  eventSource.onmessage = (event) => {
    try {
      const rawIP: RawSSEMaliciousIP = JSON.parse(event.data);
      const ip = convertSSEToMaliciousIP(rawIP);
      onIP(ip);
    } catch (error) {
      console.error("Error parsing SSE data:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE Error:", error);
    onError(error);
    eventSource.close();
  };

  return eventSource;
};

// Function to stop SSE connection
export const stopMaliciousIPSSEConnection = (
  eventSource: EventSource
): void => {
  if (eventSource) {
    eventSource.close();
  }
};
