/*import { boundsAdjusted, temperatureHumidityChart, polarChart, polarChartWind, polarChartGusts, windCharts, flag_modal_visible } from "./main_mapa_graficos.js";

// function to create the temperature and humidity charts
export function createTemperatureHumidityChart(data) {

    // Limpiamos los elementos por si tienen contenido previo (al hacer click de nuevo en el mapa para generar un nuevo graph)
    const temperatureChartCanvas = document.getElementById('temperatureChart');
    const humidityChartCanvas = document.getElementById('humidityChart');

    const temperatureChartCtx = temperatureChartCanvas.getContext('2d');
    const humidityChartCtx = humidityChartCanvas.getContext('2d');

    temperatureChartCtx.clearRect(0, 0, temperatureChartCanvas.width, temperatureChartCanvas.height);
    humidityChartCtx.clearRect(0, 0,humidityChartCanvas.width, humidityChartCanvas.height);

    if (temperatureHumidityChart) {
        temperatureHumidityChart.forEach(chart => {
            chart.destroy();
        });
    }

    const temperatureData = data.weatherData.hourly.temperature_2m;
    const humidityData = data.weatherData.hourly.relativehumidity_2m;
    const dewpointData = data.weatherData.hourly.dewpoint_2m;

    // Formateamos las fechas para que tengan el formato correcto para Luxon y Chart
    const timeLabels = data.weatherData.hourly.time;
    console.log("Weather data:", data);

    // Personalizamos la escala de fecha superior para que muestre día de la semana y fecha con estilo
    const topScale = {
        id: 'topScale',
        beforeDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, chartArea: {left, top, width, right } , scales: {x} } = chart;
            const weekdays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
            const tickLenght = x.ticks.length;
            const segment = width / tickLenght;


            x.ticks.forEach((tick, index) => {
                const d = new Date(tick.value);
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = 'black';
                ctx.fillText(weekdays[d.getDay(tick.value)], 16 + left + (segment * index), top - 5);

                const textWidth = ctx.measureText(weekdays[d.getDay(tick.value)]).width;

                ctx.font = '12px sans-serif';
                ctx.fillStyle = 'rgba(102, 102, 102, 1';
                ctx.fillText(tick.label, 16 + left + (segment * index)+ textWidth + 3, top - 5);
            });
        }
    }

    // Create Chart.js
    const temperatureChart = new Chart(temperatureChartCtx, {
        type: 'line', // Type of chart
        data: {
            labels: timeLabels, // X-axis labels
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temperatureData,
                    borderColor: 'rgba(255, 99, 132, 1)', // Color for the temperature line
                    yAxisID: 'temperature-y-axis',
                },
                {
                    label: 'Punto de rocío (C°)',
                    data: dewpointData,
                    borderColor: 'rgba(75, 99, 192, 1)',
                    yAxisID: 'dewpoint-y-axis',
                }
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x:{
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'dd MMM'
                        },
                    },
                    grid: {
                        tickColor: 'black',
                        borderColor: 'black',
                    },
                    ticks: {
                        display: false,
                    },
                    position: 'top',
                    title: {
                        display: false,
                        text: 'Tiempo',
                    },
                    suggestedMax: timeLabels[timeLabels.length -1],
                    suggestedMin: timeLabels[0],
                },
                'temperature-y-axis': {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                    },
                },
                'dewpoint-y-axis': {
                    position: 'right',
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: false,
                        text: 'Temperature (°C)',
                    },
                },
            },
            plugins: {
                tooltip: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                    mode: 'index',
                    intersect: false,
                },
            },
        },
        plugins: [topScale]
    });

    const humidityChart = new Chart(humidityChartCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Relative Humidity (%)',
                    data: humidityData,
                    borderColor: 'rgba(75, 192, 192, 1)', // Color for the humidity
                    yAxisID: 'humidity-y-axis',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        },
                    },
                    title: {
                        display: false,
                        text: 'Tiempo',
                    },
                    suggestedMax: timeLabels[timeLabels.length -1],
                    suggestedMin: timeLabels[0],
                },
                'humidity-y-axis': {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Humidity (%)',
                    },
                    ticks: {
                        stepSize: 10,
                    },
                },
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
            },
        },
    });

    temperatureChart.options.plugins.tooltip.callbacks = {
        label: function (context) {
            var label = context.dataset.label || '';
            if (label) {
                label += ": ";
            }
            label += context.parsed.y + '°C';
            return label
        }
    };

    humidityChart.options.plugins.tooltip.callbacks = {
        label: function (context) {
            var label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            label += context.parsed.y + '%'
            return label;
        }
    };

    humidityChart.options.plugins.tooltip.titleAlign = 'center';

    temperatureHumidityChart = [temperatureChart, humidityChart];
}*/

//export { createTemperatureHumidityChart };