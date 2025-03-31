import Papa from 'papaparse';

interface LocationDetail {
  city: string;
  country: string;
  coordinates: [number, number] | null;
}

// Map region codes to coordinates (which aren't in the CSV)
const regionCoordinates: Record<string, [number, number]> = {
  'us-east-1': [39.0438, -77.4874],
  'us-west-1': [37.3382, -121.8863],
  'us-west-2': [45.5155, -122.6789],
  'eu-west-1': [53.3498, -6.2603],
  'eu-central-1': [50.1109, 8.6821],
  'ap-southeast-1': [1.3521, 103.8198],
  'ap-northeast-1': [35.6762, 139.6503],
  'ap-southeast-2': [-33.8688, 151.2093]
};

// Map region codes to country codes in the CSV
const regionToCountryMap: Record<string, { country: string, region: string }> = {
  'us-east-1': { country: 'US', region: 'US-VA' },
  'us-west-1': { country: 'US', region: 'US-CA' },
  'us-west-2': { country: 'US', region: 'US-OR' },
  'eu-west-1': { country: 'IE', region: 'IE-D' },
  'eu-central-1': { country: 'DE', region: 'DE-HE' },
  'ap-southeast-1': { country: 'SG', region: 'SG-01' },
  'ap-northeast-1': { country: 'JP', region: 'JP-13' },
  'ap-southeast-2': { country: 'AU', region: 'AU-NSW' }
};

// Store locations from CSV
const locationCache: Map<string, { city: string, country: string }> = new Map();
let isLoaded = false;

// Load and parse the CSV data
const loadLocationData = async (): Promise<void> => {
  if (isLoaded) return;
  
  try {
    // Fetch CSV file from data directory
    const response = await fetch('./data/geoipfeed.csv');
    const csvData = await response.text();
    
    // Parse CSV
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    // Process each row to build location cache
    parsedData.data.forEach((row: any) => {
      const countryCode = row['country_code']; // Country code column
      const regionCode = row['region_code']; // Region code column
      const city = row['location']; // City/location column
      
      if (countryCode && regionCode && city) {
        const key = `${countryCode}:${regionCode}`;
        locationCache.set(key, {
          city,
          country: getCountryName(countryCode)
        });
      }
    });
    
    isLoaded = true;
  } catch (error) {
    console.error('Failed to load location data:', error);
  }
};

// Helper to convert country code to full name
const getCountryName = (code: string): string => {
  const countryMap: Record<string, string> = {
    'US': 'USA',
    'IE': 'Ireland',
    'DE': 'Germany',
    'SG': 'Singapore',
    'JP': 'Japan',
    'AU': 'Australia'
  };
  
  return countryMap[code] || code;
};

// The exported function with the same interface as original
const getLocationDetails = async (region: string): Promise<LocationDetail> => {
  await loadLocationData();
  
  const mapping = regionToCountryMap[region];
  if (!mapping) {
    return { city: 'Unknown', country: 'Unknown', coordinates: null };
  }
  
  const cacheKey = `${mapping.country}:${mapping.region}`;
  const locationInfo = locationCache.get(cacheKey);
  
  return {
    city: locationInfo?.city || 'Unknown',
    country: locationInfo?.country || getCountryName(mapping.country),
    coordinates: regionCoordinates[region] || null
  };
};

export default getLocationDetails;