"use client";

import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface CityData {
  id: number;
  name: string;
  rank: number;
  congestion: number;
  change: number;
  timeLostInRushHours: number;
  lat: number;
  lng: number;
  optimalDistance: number;
  rushDistance: number;
  avgSpeed: number;
  congestionLevel: number;
  distanceIn15Min: number;
  highwayRatio: number;
}

const indianCities: CityData[] = [
  {
    id: 1,
    name: "Bengaluru",
    rank: 1,
    congestion: 74.4,
    change: 1.7,
    timeLostInRushHours: 168,
    lat: 12.9716,
    lng: 77.5946,
    optimalDistance: 7.1,
    rushDistance: 3.5,
    avgSpeed: 18.2,
    congestionLevel: 85.3,
    distanceIn15Min: 4.5,
    highwayRatio: 8.2,
  },
  {
    id: 2,
    name: "Pune",
    rank: 2,
    congestion: 71.1,
    change: 5.4,
    timeLostInRushHours: 152,
    lat: 18.5204,
    lng: 73.8567,
    optimalDistance: 7.6,
    rushDistance: 3.8,
    avgSpeed: 19.8,
    congestionLevel: 78.5,
    distanceIn15Min: 4.9,
    highwayRatio: 12.1,
  },
  {
    id: 3,
    name: "Mumbai",
    rank: 3,
    congestion: 63.2,
    change: -3.3,
    timeLostInRushHours: 126,
    lat: 19.076,
    lng: 72.8777,
    optimalDistance: 6.7,
    rushDistance: 3.6,
    avgSpeed: 18.5,
    congestionLevel: 82.7,
    distanceIn15Min: 4.6,
    highwayRatio: 30.8,
  },
  {
    id: 4,
    name: "New Delhi",
    rank: 4,
    congestion: 60.2,
    change: 3.5,
    timeLostInRushHours: 104,
    lat: 28.6139,
    lng: 77.209,
    optimalDistance: 7.5,
    rushDistance: 4.0,
    avgSpeed: 23.1,
    congestionLevel: 71.7,
    distanceIn15Min: 5.8,
    highwayRatio: 5.3,
  },
  {
    id: 5,
    name: "Kolkata",
    rank: 5,
    congestion: 58.9,
    change: 0.3,
    timeLostInRushHours: 150,
    lat: 22.5726,
    lng: 88.3639,
    optimalDistance: 6.7,
    rushDistance: 3.6,
    avgSpeed: 19.4,
    congestionLevel: 76.2,
    distanceIn15Min: 4.8,
    highwayRatio: 14.5,
  },
  {
    id: 6,
    name: "Jaipur",
    rank: 6,
    congestion: 58.7,
    change: 0.4,
    timeLostInRushHours: 121,
    lat: 26.9124,
    lng: 75.7873,
    optimalDistance: 8.1,
    rushDistance: 4.4,
    avgSpeed: 21.5,
    congestionLevel: 68.9,
    distanceIn15Min: 5.4,
    highwayRatio: 9.7,
  },
  {
    id: 7,
    name: "Chennai",
    rank: 7,
    congestion: 57.3,
    change: -1.2,
    timeLostInRushHours: 118,
    lat: 13.0827,
    lng: 80.2707,
    optimalDistance: 7.5,
    rushDistance: 4.0,
    avgSpeed: 20.8,
    congestionLevel: 70.4,
    distanceIn15Min: 5.2,
    highwayRatio: 16.3,
  },
  {
    id: 8,
    name: "Hyderabad",
    rank: 8,
    congestion: 56.1,
    change: -0.8,
    timeLostInRushHours: 115,
    lat: 17.385,
    lng: 78.4867,
    optimalDistance: 7.1,
    rushDistance: 4.0,
    avgSpeed: 21.2,
    congestionLevel: 69.5,
    distanceIn15Min: 5.3,
    highwayRatio: 11.8,
  },
  {
    id: 9,
    name: "Ernakulam",
    rank: 10,
    congestion: 52.4,
    change: 1.1,
    timeLostInRushHours: 108,
    lat: 9.9312,
    lng: 76.2673,
    optimalDistance: 7.6,
    rushDistance: 4.3,
    avgSpeed: 22.4,
    congestionLevel: 65.8,
    distanceIn15Min: 5.6,
    highwayRatio: 13.2,
  },
];

const TrafficAnalysisDashboard: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [compareCity, setCompareCity] = useState<CityData | null>(null);
  const [view, setView] = useState<"map" | "table" | "compare">("map");

  const getColorByRank = (rank: number): string => {
    const colors = [
      "#8B1538", // Rank 1 - Dark maroon
      "#A0153E", // Rank 2 - Maroon
      "#C91C44", // Rank 3 - Red maroon
      "#E8604A", // Rank 4 - Orange red
      "#F27C50", // Rank 5 - Light orange red
      "#F89656", // Rank 6 - Orange
      "#FFB05C", // Rank 7 - Light orange
      "#FFCA62", // Rank 8 - Yellow orange
      "#FFE468", // Rank 9 - Yellow
      "#FFEE6F", // Rank 10 - Light yellow
    ];
    return colors[rank - 1] || "#FFEE6F";
  };

  const getRadius = (congestion: number): number => {
    return Math.max(15, Math.min(35, congestion / 2));
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            India Traffic Analysis
          </h1>
          <p className="text-gray-600">
            Real-time traffic congestion data across major Indian cities
          </p>
        </div>
      </div>

      {/* View Toggles */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => setView("map")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              view === "map"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              view === "table"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setView("compare")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              view === "compare"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Compare Cities
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-0">
        {/* Map View */}
        {view === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Map Container */}
            <div className="lg:col-span-2 bg-white overflow-hidden">
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: "600px", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {indianCities.map((city) => (
                  <CircleMarker
                    key={city.id}
                    center={[city.lat, city.lng]}
                    radius={getRadius(city.congestion)}
                    fillColor={getColorByRank(city.rank)}
                    color="#fff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.8}
                    eventHandlers={{
                      click: () => setSelectedCity(city),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                      <div className="text-center">
                        <div className="font-bold">{city.name}</div>
                        <div className="text-sm">
                          {city.congestion}% congestion
                        </div>
                      </div>
                    </Tooltip>
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-2">{city.name}</h3>
                        <div className="space-y-1 text-sm">
                          <div>Rank: #{city.rank}</div>
                          <div>Congestion: {city.congestion}%</div>
                          <div>
                            Change: {city.change > 0 ? "+" : ""}
                            {city.change} pp
                          </div>
                          <div>Rush Hours: {city.timeLostInRushHours}h</div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* City Rankings */}
            <div className="bg-white rounded-lg shadow-sm p-6 ml-6 border border-gray-200 flex flex-col max-h-[600px]">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                City Rankings
              </h2>
              <div className="space-y-3 overflow-y-auto pr-2">
                {indianCities.map((city) => (
                  <div
                    key={city.id}
                    onClick={() => setSelectedCity(city)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedCity?.id === city.id
                        ? "bg-red-50 border-2 border-red-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: getColorByRank(city.rank) }}
                      >
                        {city.rank}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {city.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {city.congestion}% congestion
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          city.change > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {city.change > 0 ? "↑" : "↓"} {Math.abs(city.change)} pp
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {view === "table" && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Congestion Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change from 2024
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time lost in Rush Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Speed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {indianCities.map((city) => (
                      <tr
                        key={city.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCity(city)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{
                              backgroundColor: getColorByRank(city.rank),
                            }}
                          >
                            {city.rank}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">
                            {city.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${city.congestion}%`,
                                  backgroundColor: getColorByRank(city.rank),
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {city.congestion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              city.change > 0
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {city.change > 0 ? "↑" : "↓"}{" "}
                            {Math.abs(city.change)} pp
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {city.timeLostInRushHours} hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {city.avgSpeed} km/h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Compare View */}
        {view === "compare" && (
          <div className="p-6">
            <div className="space-y-6">
              {/* City Selectors */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  Compare Cities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select First City
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={selectedCity?.id || ""}
                      onChange={(e) =>
                        setSelectedCity(
                          indianCities.find(
                            (c) => c.id === Number(e.target.value),
                          ) || null,
                        )
                      }
                    >
                      <option value="">Choose a city...</option>
                      {indianCities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Second City
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      value={compareCity?.id || ""}
                      onChange={(e) =>
                        setCompareCity(
                          indianCities.find(
                            (c) => c.id === Number(e.target.value),
                          ) || null,
                        )
                      }
                    >
                      <option value="">Choose a city...</option>
                      {indianCities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              {selectedCity && compareCity && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            Metric
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                            {selectedCity.name}
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                            {compareCity.name}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Country Rank
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold"
                              style={{
                                backgroundColor: getColorByRank(
                                  selectedCity.rank,
                                ),
                              }}
                            >
                              {selectedCity.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold"
                              style={{
                                backgroundColor: getColorByRank(
                                  compareCity.rank,
                                ),
                              }}
                            >
                              {compareCity.rank}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Average Congestion Level
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {selectedCity.congestionLevel}%
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {compareCity.congestionLevel}%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Average Speed
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {selectedCity.avgSpeed} km/h
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {compareCity.avgSpeed} km/h
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Distance in 15 min
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm">
                                  Optimal: {selectedCity.optimalDistance} km
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                <span className="text-sm">
                                  Rush: {selectedCity.rushDistance} km
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm">
                                  Optimal: {compareCity.optimalDistance} km
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                <span className="text-sm">
                                  Rush: {compareCity.rushDistance} km
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Highway Trip Ratio
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {selectedCity.highwayRatio}%
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {compareCity.highwayRatio}%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            Time Lost in Rush Hour
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {selectedCity.timeLostInRushHours} hours
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-semibold">
                            {compareCity.timeLostInRushHours} hours
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected City Details */}
        {selectedCity && view !== "compare" && (
          <div className="mt-6 mx-6 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: getColorByRank(selectedCity.rank) }}
              >
                {selectedCity.rank}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCity.name}
                </h2>
                <p className="text-gray-600">Detailed Traffic Metrics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">
                  Congestion Level
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCity.congestion}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedCity.change > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(selectedCity.change)} pp from 2024
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Average Speed</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCity.avgSpeed} km/h
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">
                  Time Lost in Rush Hours
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCity.timeLostInRushHours}h
                </div>
                <div className="text-xs text-gray-500 mt-1">Per year</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Highway Ratio</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedCity.highwayRatio}%
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Distance in 15 Minutes
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Optimal Hour</span>
                    </div>
                    <span className="text-sm font-bold">
                      {selectedCity.optimalDistance} km
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(selectedCity.optimalDistance / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span className="text-sm font-medium">Rush Hour</span>
                    </div>
                    <span className="text-sm font-bold">
                      {selectedCity.rushDistance} km
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${(selectedCity.rushDistance / 10) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficAnalysisDashboard;
