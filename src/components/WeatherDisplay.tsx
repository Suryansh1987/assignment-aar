import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer } from 'lucide-react';

interface WeatherData {
  location: string;
  description: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface WeatherDisplayProps {
  weather: WeatherData;
}

const getWeatherIcon = (iconCode: string) => {
  const code = iconCode.substring(0, 2);

  const iconMap: { [key: string]: JSX.Element } = {
    '01': <Sun className="w-12 h-12 text-orange" />,
    '02': <Cloud className="w-12 h-12 text-gray-400" />,
    '03': <Cloud className="w-12 h-12 text-gray-400" />,
    '04': <Cloud className="w-12 h-12 text-gray-500" />,
    '09': <CloudRain className="w-12 h-12 text-gray-600" />,
    '10': <CloudRain className="w-12 h-12 text-gray-700" />,
    '11': <CloudRain className="w-12 h-12 text-gray-800" />,
    '13': <CloudSnow className="w-12 h-12 text-gray-200" />,
    '50': <Wind className="w-12 h-12 text-gray-400" />,
  };

  return iconMap[code] || <Cloud className="w-12 h-12 text-gray-400" />;
};

export const WeatherDisplay = ({ weather }: WeatherDisplayProps) => {
  return (
    <div className="gradient-orange-bg rounded-2xl p-6 shadow-orange-lg border border-orange-light">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{weather.location}</h3>
          <p className="text-gray-600 mt-1">{weather.description}</p>
        </div>
        <div className="bg-white rounded-full p-4 shadow-orange">
          {getWeatherIcon(weather.icon)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-orange">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Thermometer className="w-4 h-4" />
            <span className="text-sm">Temperature</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{Math.round(weather.temperature)}°C</p>
          <p className="text-xs text-gray-500 mt-1">Feels like {Math.round(weather.feelsLike)}°C</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-orange">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Droplets className="w-4 h-4" />
            <span className="text-sm">Humidity</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{weather.humidity}%</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-orange col-span-2">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Wind className="w-4 h-4" />
            <span className="text-sm">Wind Speed</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{weather.windSpeed} m/s</p>
        </div>
      </div>
    </div>
  );
};