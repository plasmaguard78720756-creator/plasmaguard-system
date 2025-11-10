import React, { useState, useEffect, useRef } from 'react';
import { sensorService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SensorCharts = () => {
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [chartType, setChartType] = useState('line');
  const [selectedSensors, setSelectedSensors] = useState(['temperature', 'voltage', 'humidity', 'current']);
  const [stats, setStats] = useState({});

  const chartRef = useRef();

  // Opciones de tiempo
  const timeOptions = [
    { value: '6h', label: 'Últimas 6 horas' },
    { value: '12h', label: 'Últimas 12 horas' },
    { value: '24h', label: 'Últimas 24 horas' },
    { value: '3d', label: 'Últimos 3 días' },
    { value: '7d', label: 'Última semana' }
  ];

  // Opciones de sensores
  const sensorOptions = [
    { value: 'temperature', label: 'Temperatura (°C)', color: 'rgb(239, 68, 68)' },
    { value: 'humidity', label: 'Humedad (%)', color: 'rgb(34, 197, 94)' },
    { value: 'voltage', label: 'Voltaje (V)', color: 'rgb(59, 130, 246)' },
    { value: 'current', label: 'Corriente (A)', color: 'rgb(168, 85, 247)' }
  ];

  useEffect(() => {
    loadChartData();
    const interval = setInterval(loadChartData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [timeRange, selectedSensors]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos históricos
      const response = await sensorService.getHistory({ 
        hours: getHoursFromRange(timeRange),
        limit: 100 
      });

      if (response.data) {
        processChartData(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error cargando datos para gráficas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHoursFromRange = (range) => {
    const ranges = {
      '6h': 6,
      '12h': 12,
      '24h': 24,
      '3d': 72,
      '7d': 168
    };
    return ranges[range] || 24;
  };

  const processChartData = (sensorData) => {
    const labels = sensorData.map(item => 
      new Date(item.created_at).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ).reverse();

    const datasets = sensorOptions
      .filter(sensor => selectedSensors.includes(sensor.value))
      .map(sensor => ({
        label: sensor.label,
        data: sensorData.map(item => item[sensor.value]).reverse(),
        borderColor: sensor.color,
        backgroundColor: chartType === 'line' 
          ? `${sensor.color}20` 
          : sensor.color,
        borderWidth: chartType === 'line' ? 3 : 1,
        fill: chartType === 'line',
        tension: 0.4,
        pointBackgroundColor: sensor.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }));

    setChartData({
      labels,
      datasets
    });
  };

  const calculateStats = (sensorData) => {
    const stats = {};
    
    sensorOptions.forEach(sensor => {
      const values = sensorData.map(item => item[sensor.value]);
      if (values.length > 0) {
        stats[sensor.value] = {
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
          avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
          current: values[values.length - 1].toFixed(2)
        };
      }
    });

    setStats(stats);
  };

  const toggleSensor = (sensorValue) => {
    setSelectedSensors(prev => 
      prev.includes(sensorValue) 
        ? prev.filter(s => s !== sensorValue)
        : [...prev, sensorValue]
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Datos de Sensores - ${timeOptions.find(t => t.value === timeRange)?.label}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(2);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  const downloadChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `grafica-sensores-${timeRange}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  if (loading && !chartData.labels) {
    return (
      <div className="bg-theme-card rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
            <p className="mt-2 text-theme-muted">Cargando datos para gráficas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de la gráfica */}
      <div className="bg-theme-card rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-theme">📊 Gráficas de Sensores</h2>
            <p className="text-theme-muted">Visualización en tiempo real de los datos del sistema</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Selector de tiempo */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme bg-white"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Selector de tipo de gráfica */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme bg-white"
            >
              <option value="line">Gráfica de Línea</option>
              <option value="bar">Gráfica de Barras</option>
            </select>

            {/* Botón descargar */}
            <button
              onClick={downloadChart}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
            >
              📥 Descargar
            </button>

            {/* Botón actualizar */}
            <button
              onClick={loadChartData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Selector de sensores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme mb-3">Sensores a mostrar:</h3>
          <div className="flex flex-wrap gap-3">
            {sensorOptions.map(sensor => (
              <button
                key={sensor.value}
                onClick={() => toggleSensor(sensor.value)}
                className={`px-4 py-2 rounded-lg border-2 transition flex items-center gap-2 ${
                  selectedSensors.includes(sensor.value)
                    ? 'border-theme-primary bg-blue-50 text-theme-primary'
                    : 'border-gray-300 bg-white text-theme-muted hover:border-theme-primary'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sensor.color }}
                ></div>
                {sensor.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfica */}
        <div className="h-96">
          {chartData.labels && chartData.datasets && chartData.datasets.length > 0 ? (
            chartType === 'line' ? (
              <Line 
                ref={chartRef}
                data={chartData} 
                options={chartOptions} 
              />
            ) : (
              <Bar 
                ref={chartRef}
                data={chartData} 
                options={chartOptions} 
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📈</div>
                <p className="text-theme-muted text-lg">Selecciona al menos un sensor para mostrar</p>
                <p className="text-gray-400 text-sm">Usa los botones de arriba para elegir qué datos visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {Object.keys(stats).length > 0 && (
        <div className="bg-theme-card rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-theme mb-4">📈 Estadísticas del Período</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sensorOptions
              .filter(sensor => selectedSensors.includes(sensor.value))
              .map(sensor => (
                <div key={sensor.value} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: sensor.color }}
                    ></div>
                    <h4 className="font-semibold text-theme">{sensor.label}</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Actual:</span>
                      <span className="font-medium text-theme">
                        {stats[sensor.value]?.current} 
                        {sensor.value === 'temperature' ? '°C' : 
                         sensor.value === 'humidity' ? '%' :
                         sensor.value === 'voltage' ? 'V' : 'A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Mínimo:</span>
                      <span className="font-medium text-red-600">
                        {stats[sensor.value]?.min}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Máximo:</span>
                      <span className="font-medium text-green-600">
                        {stats[sensor.value]?.max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-muted">Promedio:</span>
                      <span className="font-medium text-blue-600">
                        {stats[sensor.value]?.avg}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorCharts;