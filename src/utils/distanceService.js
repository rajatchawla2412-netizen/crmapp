import { customFetch } from './api'

/**
 * Calculates the driving distance between two points using the OpenRouteService Matrix API.
 * 
 * @param {Array<number>} startPoint - The start coordinates in the format [longitude, latitude]
 * @param {Array<number>} endPoint - The end coordinates in the format [longitude, latitude]
 * @returns {Promise<number>} - The driving distance in kilometers (distances[0][1])
 */
export async function calculateDrivingDistance(startPoint, endPoint) {
  // Input Validation
  if (!Array.isArray(startPoint) || startPoint.length !== 2 || typeof startPoint[0] !== 'number' || typeof startPoint[1] !== 'number') {
    throw new Error('Invalid startPoint. Expected an array of [longitude, latitude] numbers.');
  }
  if (!Array.isArray(endPoint) || endPoint.length !== 2 || typeof endPoint[0] !== 'number' || typeof endPoint[1] !== 'number') {
    throw new Error('Invalid endPoint. Expected an array of [longitude, latitude] numbers.');
  }

  // Retrieve the OpenRouteService API key from Vite's environment variables
  // TODO(security): API keys should be securely retrieved from environment variables and not hardcoded.
  const apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;
  if (!apiKey || apiKey === 'your_openrouteservice_api_key_here') {
    throw new Error('OpenRouteService API key is missing or not configured in environment variables.');
  }

  const url = 'https://api.openrouteservice.org/v2/matrix/driving-car';

  const body = {
    locations: [startPoint, endPoint],
    destinations: [0, 1],
    id: 'my_req',
    metrics: ['distance'],
    units: 'km'
  };

  try {
    const response = await customFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouteService API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.distances) || data.distances.length < 1 || !Array.isArray(data.distances[0]) || data.distances[0].length < 2) {
      throw new Error('Unexpected response structure from OpenRouteService API.');
    }

    const distance = data.distances[0][1];
    if (typeof distance !== 'number') {
      throw new Error('Returned distance value is not a number.');
    }

    return distance;
  } catch (error) {
    console.error('Error in calculateDrivingDistance service:', error.message);
    throw error;
  }
}
