import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWeatherHistory } from '../utils/weatherGenerator';
import { getHorizonDate, formatHorizonYear } from '../utils/horizonCalendar';

const Weather: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const weatherHistory = getWeatherHistory(8); // Current + 8 past weeks
  const currentWeather = weatherHistory[selectedWeek];
  const horizonDate = getHorizonDate();

  const getDayLabel = (index: number): string => {
    // Days within a Horizon week: Day 1, Day 2, ... Day 7
    return `Day ${index + 1}`;
  };

  const getConditionColor = (type: string) => {
    switch (type) {
      case 'clear': return 'bg-yellow-100 border-yellow-300';
      case 'partly-cloudy': return 'bg-blue-50 border-blue-200';
      case 'cloudy':
      case 'overcast': return 'bg-gray-100 border-gray-300';
      case 'rain':
      case 'drizzle': return 'bg-blue-100 border-blue-300';
      case 'heavy-rain':
      case 'thunderstorm': return 'bg-indigo-100 border-indigo-300';
      case 'snow':
      case 'heavy-snow':
      case 'sleet': return 'bg-slate-100 border-slate-300';
      case 'fog': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Weather & Moon Phases</h2>
      </div>
      
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <span>Weather</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-6">Horizon Valley Weather</h1>

        {/* Current Season Banner */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center gap-4">
          <img 
            src={horizonDate.phase.image} 
            alt={horizonDate.phase.name}
            className="w-24 h-16 object-cover rounded border border-gray-300"
          />
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {horizonDate.phase.name}, {formatHorizonYear(horizonDate.year)}
            </div>
            <div className="text-sm text-gray-600">
              {horizonDate.daysUntilNextPhase} days until {horizonDate.nextPhase.name}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl">{currentWeather.moonPhase.icon}</div>
            <div className="text-sm text-gray-600">{currentWeather.moonPhase.name}</div>
            <div className="text-xs text-gray-500">{currentWeather.moonPhase.illumination}% illuminated</div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
            Select Week
          </label>
          <div className="flex flex-wrap gap-2">
            {weatherHistory.map((week, index) => (
              <button
                key={index}
                onClick={() => setSelectedWeek(index)}
                className={`px-3 py-1 text-sm border rounded transition-colors ${
                  selectedWeek === index
                    ? 'bg-green-700 text-white border-green-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {week.weekLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Week Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {currentWeather.weekLabel}, {formatHorizonYear(currentWeather.horizonYear)}
          </h3>
          <p className="text-sm text-gray-700">{currentWeather.weekSummary}</p>
        </div>

        {/* Daily Weather Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-8">
          {currentWeather.days.map((day, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${getConditionColor(day.condition.type)} ${
                isToday(day.date) ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="text-center">
                <div className={`text-xs font-semibold uppercase ${isToday(day.date) ? 'text-green-700' : 'text-gray-600'}`}>
                  {isToday(day.date) ? 'Today' : getDayLabel(index)}
                </div>
                <div className="text-xs text-gray-500 mb-2">{day.dayOfWeek}</div>
                <div className="text-3xl mb-1">{day.condition.icon}</div>
                <div className="text-xs text-gray-600 mb-2">{day.condition.description}</div>
                <div className="text-lg font-bold text-gray-900">{day.highTemp}°</div>
                <div className="text-sm text-gray-500">{day.lowTemp}°</div>
                <div className="text-xs text-gray-500 mt-2">
                  {day.windSpeed > 0 && `${day.windDirection} ${day.windSpeed}mph`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Day View */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Details</h3>
        <div className="space-y-4">
          {currentWeather.days.map((day, index) => (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden ${isToday(day.date) ? 'ring-2 ring-green-500' : 'border-gray-200'}`}
            >
              <div className={`px-4 py-2 ${getConditionColor(day.condition.type)} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{day.condition.icon}</span>
                    <div>
                      <span className="font-semibold text-gray-900">
                        {getDayLabel(index)} ({day.dayOfWeek})
                        {isToday(day.date) && <span className="ml-2 text-green-600 text-sm">(Today)</span>}
                      </span>
                      <div className="text-sm text-gray-600">{day.condition.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {day.highTemp}° / {day.lowTemp}°
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-white">
                <p className="text-sm text-gray-700 italic mb-3">"{day.description}"</p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Wind:</span>
                    <div className="font-medium text-gray-800">{day.windDirection} {day.windSpeed} mph</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Precipitation:</span>
                    <div className="font-medium text-gray-800">{day.precipitation}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Humidity:</span>
                    <div className="font-medium text-gray-800">{day.humidity}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">High/Low:</span>
                    <div className="font-medium text-gray-800">{day.highTemp}°F / {day.lowTemp}°F</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Moon Phase Details */}
        <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-indigo-900 px-4 py-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">{currentWeather.moonPhase.icon}</span>
              Moon Phase: {currentWeather.moonPhase.name}
            </h3>
          </div>
          <div className="px-4 py-4 bg-indigo-50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Illumination:</span>
                <div className="font-semibold text-gray-900">{currentWeather.moonPhase.illumination}%</div>
              </div>
              <div>
                <span className="text-gray-600">Days until Full Moon:</span>
                <div className="font-semibold text-gray-900">{currentWeather.moonPhase.daysUntilFull} days</div>
              </div>
              <div>
                <span className="text-gray-600">Days until New Moon:</span>
                <div className="font-semibold text-gray-900">{currentWeather.moonPhase.daysUntilNew} days</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700">
              <p>
                {currentWeather.moonPhase.name === 'Full Moon' && 
                  'The full moon bathes the valley in silver light, making night travel easier but hiding nothing from watchful eyes.'}
                {currentWeather.moonPhase.name === 'New Moon' && 
                  'The new moon leaves the nights dark and mysterious. Stars shine brilliantly, but shadows are deep.'}
                {currentWeather.moonPhase.name === 'First Quarter' && 
                  'The half-moon provides moderate light in the evening hours before setting around midnight.'}
                {currentWeather.moonPhase.name === 'Third Quarter' && 
                  'The half-moon rises late, providing light in the pre-dawn hours for early risers.'}
                {currentWeather.moonPhase.name === 'Waxing Crescent' && 
                  'A sliver of moon appears in the western sky after sunset, growing brighter each night.'}
                {currentWeather.moonPhase.name === 'Waxing Gibbous' && 
                  'The moon grows fuller, providing good light through most of the night.'}
                {currentWeather.moonPhase.name === 'Waning Gibbous' && 
                  'The moon rises later each night, still bright enough to cast shadows.'}
                {currentWeather.moonPhase.name === 'Waning Crescent' && 
                  'Only a thin crescent remains, visible in the pre-dawn sky before fading to darkness.'}
              </p>
            </div>
          </div>
        </div>

        {/* Flavor Text */}
        <div className="mt-8 text-xs text-gray-500 italic text-center">
          Weather patterns based on the Pacific Northwest climate of the early 1900s.
          <br />
          The Horizon Valley experiences four distinct seasons with weather typical of the Washington State region.
        </div>
      </div>
    </section>
  );
};

export default Weather;
