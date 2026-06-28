export function formatLocation(googlePlace: string): string {
  const parts = googlePlace.split(',').map(p => p.trim())
  
  // Google format: area, city, state, country
  // We want: state, area
  const area = parts[0]   // "Lekki Phase 1"
  const city = parts[1]   // "Lagos"

  return `${city}, ${area}`
}