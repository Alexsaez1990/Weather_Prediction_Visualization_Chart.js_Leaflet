/*
Proyecto visualización gráficos predicciones meteorológicas
Creado por: Alejandro Sáez Subero
Sección Estudios y Proyectos
Conaf
Fecha: Octubre-noviembre 2023
*/

var lat = 0;
var lng = 0;
var days = 2;
var map = L.map('mapa');
//map.setMaxBounds([[-3, -78], [-14, -63], [-56, -79], [-56, -63], [-3, -78]]);
map.fitBounds([[-14, -79], [-14, -63], [-56, -79], [-56, -63], [-14, -79]]);
map.setView([-33.46, -71]);

let boundsAdjusted = false;
let temperatureHumidityChart = [];
let polarChart = [];
let polarChartWind = [];
let polarChartGusts = [];
let windCharts = [];
var flag_modal_visible = false;
let precipitationCloudsChart = [];
let hovmollerTemperatureChart = []
let marker = null;


// PROYECCIÓN EPSG:4326
var proyeccion = new L.Proj.CRS('EPSG:4326', '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs', {
    resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
});
var base = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 3,
    maxZoom: 18,
    crs: proyeccion,
    zoomControl: false,
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
}).addTo(map);

if(screen.width >= 712){
    map.setZoom(8);
}else {
    map.setZoom(4);
}

function handleMapClick(e) {
    lat = e.latlng.lat; // Obtengo latitud
    lng = e.latlng.lng; // Obtengo longitud
    const daysSelector = document.getElementById('daysSelector');
    days = parseInt(daysSelector.value); // Obtengo el número de días a mostrar

    // Elimina markers previos
    if (marker) { 
        map.removeLayer(marker);
    }
    // Crea nuevo marker
    marker = L.marker(e.latlng).addTo(map);
    marker.bindPopup(`Coords. ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();

    map.flyTo(e.latlng, 10);

    console.log(JSON.stringify({ lat: lat, lng: lng, days: days }))

    // Show the graph container
    const graphContainer = document.getElementById('graph-container');
    graphContainer.style.display = 'block';

    // Movemos el mapa a la izda cuando aparecen los gráficos:
    if (!boundsAdjusted) {
        // Ajusta nuevos bounds
        const currentBounds = map.getBounds();
    
        // Reajusta bounds al cambio de tamaño
        const newNorthEast = currentBounds.getNorthEast();
        const newSouthWest = currentBounds.getSouthWest();
        newSouthWest.lng += 5; // Adjust the longitude shift value here

        const newBounds = L.latLngBounds(newSouthWest, newNorthEast);

        // Mueve el map a los nuevos bounds
        map.flyToBounds(newBounds, { animate: true });
        boundsAdjusted = true;
    }
    // Generamos charts
    callCharts(lat, lng, days);

    // Evento para cambio días
    daysSelector.addEventListener('change', function () {
        days = parseInt(daysSelector.value);
        callCharts(lat, lng, days);
    });
}

map.on('click', handleMapClick);

// Función para comunicar con el backend, traer info y generar charts
function callCharts(lat, lng, days) {
    const currentBounds = map.getBounds();
    updateMap(lat, lng);

    if (!currentBounds.equals(map.getBounds())) {
        preset_zoom = 8
        map.setView([lat, lng+2.5], preset_zoom);
        boundsAdjusted = true;
    }

    fetch('http://localhost:5000/process', { // Me conecto con el servidor para enviar lat y lng
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({lat: lat, lng: lng, days: days})
    })
    .then(response => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('Error in the request');
        }
    })
    .then(data => { // Recibo los datos de Python
        document.getElementById('exportButton').addEventListener('click', function() {
            exportToExcel(data); // Assuming data is available here
        });

        createTemperatureHumidityChart(data);
        createPolarChart(data);
        createPrecipitationCloudsChart(data);
        //createHovmollerTemperatureChart(data);

        checkboxesFunctionality();    
    })
    .catch(error => {
        console.error('Error: ', error);
    })
}

function updateMap(lat, lng) {
    // Center the map on the selected coordinates
    map.setView([lat, lng]);

    // Display a label on the map
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`Coords. ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();
}

function checkboxesFunctionality() {
    // Funcionalidad checkboxes
    temperatureChartContainer.style.display = 'block';
    humidityChartContainer.style.display = 'block';
    polarChartContainer.style.display = 'block';
    precipitationCloudChartContainer.style.display = 'none';
    cloudChartContainer.style.display = 'none';

    // Checkboxes
    const temperatureHumidityCheckbox = document.getElementById('temperatureHumidityCheckbox');
    const polarCheckbox = document.getElementById('polarCheckbox');
    const precipitationCloudCheckbox = document.getElementById('precipitationCloudCheckbox');

    temperatureHumidityCheckbox.checked = true;
    polarCheckbox.checked = true;
    precipitationCloudCheckbox.checked = false;

    setupChartToggle();
}

// Event para hacer draggable el Modal
let isDragging = false; 
document.addEventListener("DOMContentLoaded", function () {
    let modalOffsetX, modalOffsetY;

    const modalContainer = document.getElementById("modalContainer");
    //const modal = modalContainer.querySelector(".modal");
    const modalHeader = modalContainer.querySelector(".modal-header");
    modalContainer.style.display = 'none';

    modalHeader.addEventListener("mousedown", e => {
        isDragging = true;
        modalOffsetX = e.clientX - modalContainer.getBoundingClientRect().left;
        modalOffsetY = e.clientY - modalContainer.getBoundingClientRect().top;
        modalContainer.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        if (isDragging) {
            const newLeft = e.clientX - modalOffsetX;
            const newTop = e.clientY - modalOffsetY;
            modalContainer.style.left = newLeft + "px";
            modalContainer.style.top = newTop + "px";
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        modalContainer.style.cursor = "grab";
    });
});

function modalClose() {
    modalContainer.style.display = "none";
}


// Función para exportar contenido de data a excel
function exportToExcel(data) {
    const hourlyData = data.weatherData.hourly;

    // Extract time labels
    const timeLabels = hourlyData.time;

    // Extract all other hourly data
    const exportedData = timeLabels.map((time, index) => {
        return {
            Time: time,
            Temperature: hourlyData.temperature_2m[index],
            Dewpoint: hourlyData.dewpoint_2m[index],
            CloudCover: hourlyData.cloudcover[index],
            Precipitation: hourlyData.precipitation[index],
            PrecipitationProbability: hourlyData.precipitation_probability[index],
            RelativeHumidity: hourlyData.relativehumidity_2m[index],
            WindDirection: hourlyData.winddirection_10m[index],
            WindGusts: hourlyData.windgusts_10m[index],
            WindSpeed: hourlyData.windspeed_10m[index]
        };
    });

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Add a worksheet
    const ws = XLSX.utils.json_to_sheet(exportedData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'HourlyData');

    // Save the workbook as an Excel file
    XLSX.writeFile(wb, 'Data.xlsx');
}

// Función calcular variable HCFM
function calculate_HCFM(humidityData, temperatureData) {
    const roundedHumidity = humidityData.map(humidity => Math.round(humidity));
    const roundedTemperature = temperatureData.map(temperature => Math.round(temperature));

    return roundedHumidity.map((humidity, index) => Math.round((0.297374 + (0.262 * humidity) - (0.00982 * roundedTemperature[index])) * 100) / 100);
}

// Chart temperatura y humedad
function createTemperatureHumidityChart(data) {

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
    const hcfmData = calculate_HCFM(humidityData, temperatureData);

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

    let xHoverCoor;
    let yHoverCoor;
    let hoverIndex;
    const hoverLabel = {
        id: 'hoverLabel',
        beforeDatasetsDraw(chart, args, plugins) {
            const {ctx, chartArea: {top, bottom, left, right, width, length, height}, scales: {x2, 'temperature-y-axis': temperatureYAxis, 'dewpoint-y-axis': dewpointYAxis} } = chart;

            if (xHoverCoor && yHoverCoor) {
                const nearestX = x2.getValueForPixel(xHoverCoor);
                const nearestXDate = new Date(nearestX).setHours(0, 0, 0, 0);

                ctx.save();
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 26, 104, 0.2';
                ctx.fillRect(xHoverCoor - 10, top, 20, height);
                ctx.restore();
            }
        },
        afterDatasetsDraw(chart, args, plugins) {
            const {ctx, chartArea: {top, bottom, left, right, width, length, height}, scales: {x2, 'temperature-y-axis': temperatureYAxis, 'dewpoint-y-axis': dewpointYAxis} } = chart;
            ctx.save();
            if (xHoverCoor && yHoverCoor) { 
                // hoverLine
                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.setLineDash([3, 3]);
                const hoverY = temperatureYAxis.getPixelForValue(temperatureData[hoverIndex]);
                ctx.moveTo(left, hoverY);
                ctx.lineTo(right, hoverY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            ctx.restore();           
        },

        afterEvent(chart, args) {
            const {ctx, chartArea: {top, bottom, left, right, width, length, height}, scales: {x2, 'temperature-y-axis': temperatureYAxis, 'dewpoint-y-axis': dewpointYAxis, 'humidity-y-axis': humidityYAxis } } = chart;
            const canvas = chart.canvas;
            if(args.inChartArea) {
                canvas.addEventListener('mousemove', (e) => {
                    nearestValue(chart, e);
                });

                function nearestValue(chart, mousemove) {
                    const points = chart.getElementsAtEventForMode(mousemove, 'nearest', {intersect: false}, true);

                    if (points.length) {
                        hoverIndex = points[0].index;
                    }
                }
                xHoverCoor = args.event.x;
                yHoverCoor = args.event.y;
            }else {
                xHoverCoor = undefined;
                yHoverCoor = undefined;
                hoverIndex = undefined;
            }

            args.changed = true;
        }
    }

    // Variables para establecer máximos y mínimos comunes a ambos ejes X (temperature y dewpoint)
    const allData = [...temperatureData, ...dewpointData];
    const minValue = Math.floor(Math.min(...allData) - 1);
    const maxValue = Math.floor(Math.max(...allData) + 1);

    // Crea Chart.js
    const temperatureChart = new Chart(temperatureChartCtx, {
        type: 'line', // Type of chart
        data: {
            labels: timeLabels, // X-axis labels
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temperatureData,
                    borderColor: 'rgba(255, 99, 132, 1)', 
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
                x2: {
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
                    position: 'bottom',
                    suggestedMax: timeLabels[timeLabels.length -1],
                    suggestedMin: timeLabels[0],
                    display: false,
                },
                'temperature-y-axis': {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                    },
                    max: maxValue, 
                    min: minValue, 
                },
                'dewpoint-y-axis': {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Punto de rocío (°C)',
                    },
                    max: maxValue,
                    min: minValue,
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
                title: {
                    display: true,
                    text: 'Temperatura, Punto de rocío y Humedad relativa',
                    font: {
                        weight: 'bold',
                        size: '15',
                    },
                    padding: '10',
                },
            },
        },
        plugins: [topScale, hoverLabel]
    });
    const humidityChart = new Chart(humidityChartCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Humedad relativa (%)',
                    data: humidityData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    yAxisID: 'humidity-y-axis',
                },
                {
                    label: 'HCFM (%)',
                    data: hcfmData,
                    borderColor: 'rgba(255, 165, 0, 0.7)',
                    yAxisID: 'hcfm-y-axis',
                }
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
                'hcfm-y-axis': {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: false,
                        text: 'HCFM (%)',
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return `${value} %`;
                        }
                    },
                    max: 100,
                    min: 0,
                },
                'humidity-y-axis': {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: false,
                        text: 'Humidity (%)',
                    },
                    ticks: {
                        stepSize: 10,
                        callback: function(value) {
                            return `${value} %`;
                        },
                    },
                    max: 100,
                    min: 0,
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
}

// Función para Polar chart
function createPolarChart(data) {
    // Limpiamos los elementos por si tienen contenido previo (al hacer click de nuevo en el mapa para generar un nuevo graph)
    if (polarChart.length > 0) {
        polarChart.forEach(chart => {
            chart.destroy();
        });
        polarChart.length = 0;
    }

    const polarChartCanvas = document.getElementById('polarChart');
    polarChartCanvas.height = 5; // Lo toma como una proporcion. '--'
    polarChartCanvas.width = 1; //

    const polarChartCtx = polarChartCanvas.getContext('2d');

    const windSpeedData = data.weatherData.hourly.windspeed_10m;
    const windDirectionData = data.weatherData.hourly.winddirection_10m;
    const windGustsData = data.weatherData.hourly.windgusts_10m; // rachas
    const timeLabels = data.weatherData.hourly.time;

    const categories = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const categorizedWindDirectionData = Array(8).fill(0);

    windDirectionData.forEach(direction => {
        const categoryIndex = Math.floor((direction + 22.5) / 45) % 8;
        categorizedWindDirectionData[categoryIndex]++;
    });

    const totalDataPoints = windDirectionData.length;

    // Racha de viento máxima en cada dirección
    const maxGustsData = [];
    for (let i=0; i<categorizedWindDirectionData.length; i++) {
        maxGustsData[i] = Math.max(...windGustsData.slice(i * (totalDataPoints / 8), (i + 1) * (totalDataPoints / 8)));
    }

    // Velocidad de viento máxima en cada dirección
    const maxWindSpeedData = [];
    for (let i=0; i<categorizedWindDirectionData.length; i++) {
        maxWindSpeedData[i] = Math.max(...windSpeedData.slice(i * (totalDataPoints / 8), (i + 1) * (totalDataPoints / 8)));
    }

    const timePercentageData = categorizedWindDirectionData.map((count, index) => ({
        percentage: (count / totalDataPoints) * 100,
        windSpeed: maxWindSpeedData[index], 
    }));
    
    const windSpeedCategories = maxWindSpeedData.map(speed => {
        if (speed >= 0.1 && speed < 3.0) {
            return '#5CA2D1';
        } else if (speed >= 3.0 && speed < 5.0) {
            return '#055D00';
        } else if (speed >= 5.0 && speed < 10.0) {
            return '#229A00';
        }else if (speed >= 10.0 && speed < 15.0) {
            return '#B2DF8A';
        }else if (speed >= 15.0 && speed < 20.0) {
            return '#FFF700';
        }else if (speed >= 20.0 && speed < 25.0) {
            return '#FFCC00';
        }else if (speed >= 25.0 && speed < 30.0) {
            return '#F99D59';
        }else if (speed >= 30.0) {
            return '#E31A1C';
        }
    });

    const multiThresholdLine = {
        id: 'multiThresholdLine',
        afterDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, data, scales: {r} } = chart;

            const segments = pluginOptions.lineValue.length;
            pluginOptions.lineValue.forEach((value, index) => {
                const trueHeight = r.yCenter - r.top;
                const radius = (trueHeight / r.end * value) - Math.floor(value / 2);
                const angleStart = (Math.PI * -0.5 + (Math.PI * 2) / segments * index)  - (Math.PI * 45/360) + (Math.PI * 45/360);  // Si le pongo 40 en lugar de 45, se verá la linea

                const angleEnd = (Math.PI * -0.5 + (Math.PI * 2) / segments * (index + 1))  - (Math.PI * 45/360) - (Math.PI * 45/360); // Si le pongo 40 en lugar de 45, se verá la linea

                ctx.save();

                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = data.datasets[1].borderColor[index];
                ctx.arc(r.xCenter, r.yCenter, radius, angleStart, angleEnd, false);
                ctx.stroke();
                ctx.restore();
            });
        }
    }

    const chartPolar = new Chart(polarChartCtx, { 
        type: 'polarArea',
        data: {
            labels: categories,
            datasets: [
                {
                    label: '% tiempo (horas)',
                    data: timePercentageData.map(({ percentage, windSpeed}) => ({r: percentage, windSpeed: windSpeed})),
                    backgroundColor: windSpeedCategories,
                    borderColor: windSpeedCategories,  
                },
                {
                    label: 'Rachas máximas (Km/h)',
                    data: maxGustsData,
                    yAxisID: 'gusts-y-axis',
                    backgroundColor: 'transparent',
                    borderColor:'transparent',
                    borderWidth: 0,
                },

            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    startAngle: -22.5,
                    pointLabels: {
                        display: true,
                        font: {
                            size: 18,
                        },
                        centerPointLabels: true,
                    },
                    ticks: {
                    },
                },
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false, 
                },
                multiThresholdLine: {
                    lineValue: maxGustsData
                },
                legend: {
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'triangle',
                        boxWidth: 20,
                    },
                    display: false,
                },
                title: {
                    display: true,
                    text: '% Viento/Dirección y Velocidad',
                    font: {
                        weight: 'bold',
                        size: '15',
                    },
                    padding: '20',
                },
            },
        },
        plugins: [multiThresholdLine]
    });

    
    document.getElementById("1Button").style.backgroundColor = '#5CA2D1'; 
    document.getElementById("2Button").style.backgroundColor = '#055D00'; 
    document.getElementById("3Button").style.backgroundColor = '#229A00';
    document.getElementById("4Button").style.backgroundColor = '#B2DF8A';
    document.getElementById("5Button").style.backgroundColor = '#FFF700';
    document.getElementById("6Button").style.backgroundColor = '#FFCC00';
    document.getElementById("7Button").style.backgroundColor = '#F99D59';
    document.getElementById("8Button").style.backgroundColor = '#E31A1C';
    document.getElementById("1Button").innerText = "0.1-3 km/h";
    document.getElementById("2Button").innerText = "3-5 km/h";
    document.getElementById("3Button").innerText = "5-10 km/h";
    document.getElementById("4Button").innerText = "10-15 km/h";
    document.getElementById("5Button").innerText = "15-20 km/h";
    document.getElementById("6Button").innerText = "20-25 km/h";
    document.getElementById("7Button").innerText = "25-30 km/h";
    document.getElementById("8Button").innerText = ">30 km/h";

    chartPolar.canvas.onclick = function (click) {
        clickHandler(click, chartPolar, windSpeedData, windDirectionData, windGustsData, timeLabels);
    };

    body_full = document.getElementsByTagName("body")[0];
    body_full.onclick = function() {
        document.addEventListener("mouseup", (event) => {
            if (flag_modal_visible && !modalContainer.contains(event.target)) {
                flag_modal_visible = false;
                modalContainer.style.display = "none";
            }
        })
        
    }
    polarChart.push(chartPolar);
    flag_modal_visible = true;
}

// Función para mostar el Modal al hacer click en el polar chart
function clickHandler(click, chartPolar, windSpeedData, windDirectionData, windGustsData, timeLabels) {
        
    const chartArea = chartPolar.chartArea;
    const {offsetX, offsetY} = click;

    // Centro y radio del polar chart
    const centerX = chartArea.left + (chartArea.right - chartArea.left) / 2;
    const centerY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;
    const radius = Math.min(centerX - chartArea.left, centerY - chartArea.top);

    // Ángulo relativo al centro del chart
    let angle = Math.atan2(offsetY - centerY, offsetX - centerX);
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    // Definir ángulos para los segmentos
    const segmentAngles = [
        0, Math.PI / 4, (2 * Math.PI) / 4, (3 * Math.PI) / 4, (4 * Math.PI) / 4,
        (5 * Math.PI) / 4, (6 * Math.PI) / 4, (7 * Math.PI) / 4, 2 * Math.PI
    ];

    let segmentIndex = -1;
    for (let i = 0; i< segmentAngles.length -1; i++ ) {
        if (angle >= segmentAngles[i] && angle <= segmentAngles[i+1]) {
            segmentIndex = i;
            break;
        }
    }

    if (segmentIndex !== -1) {
        //const modal = document.getElementById("modalContainer");
        const labels =document.querySelectorAll(".label");
        obj_fecha_inic = formatDate(timeLabels[0]);
        obj_fecha_fin = formatDate(timeLabels[timeLabels.length-1]);
        fecha_inic = obj_fecha_inic.dayName + " " + obj_fecha_inic.day + " " + obj_fecha_inic.month + " " + obj_fecha_inic.year + " " + obj_fecha_inic.hours + ":" + obj_fecha_inic.minutes;
        fecha_fin = obj_fecha_fin.dayName + " " + obj_fecha_fin.day + " " + obj_fecha_fin.month + " " + obj_fecha_fin.year + " " + obj_fecha_fin.hours + ":" + obj_fecha_fin.minutes;
        rango_fechas = fecha_inic +" - " + fecha_fin;
        labels.forEach(label => {
            label.innerText = rango_fechas;
        });
        modalContainer.style.display = 'flex';

        createWindChart(windSpeedData, windDirectionData, windGustsData, timeLabels);
    }
    flag_modal_visible = true;
}

// Función para formateo de fechas
function formatDate(date) {
    var daysNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
        monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'],
        d = new Date(date),
        day = d.getDate().toString(),
        month = monthNames[d.getMonth()].toString(),
        year = d.getFullYear().toString(),
        hours = d.getHours().toString(),
        minutes = d.getMinutes().toString(),
        dayName = daysNames[d.getDay()];
    
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (minutes < 10) {
        minutes = '0' + minutes;
    }

    let formatoFecha = {
        d: d,
        day: day,
        month: month,
        year: year,
        hours: hours,
        minutes: minutes,
        dayName: dayName
    }
    return formatoFecha;
}

// Chart wind
function createWindChart(windSpeedData, windDirectionData, windGustsData, timeLabels) {

    // Limpiamos los elementos por si tienen contenido previo (al hacer click de nuevo en el mapa para generar un nuevo graph)
    const windChartCanvas = document.getElementById('windChart');

    const windChartCtx = windChartCanvas.getContext('2d');

    windChartCtx.clearRect(0, 0, windChartCanvas.width, windChartCanvas.height);

    if (windCharts) {
        windCharts.forEach(chart => {
            chart.destroy();
        });
    }

    const categories = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    const direction_categorized = windDirectionData.map(direction => {
        let categoryIndex = Math.floor(direction / 45);
        if (categoryIndex == 8) {categoryIndex = 0;}
        return categories[categoryIndex]
    })

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
                // Adjust the top padding for the top label
                const paddingTop = index === 0 ? 20 : 0;
                ctx.fillText(weekdays[d.getDay(tick.value)], 16 + left + (segment * index), top - 7);
                const textWidth = ctx.measureText(weekdays[d.getDay(tick.value)]).width;

                ctx.font = '12px sans-serif';
                ctx.fillStyle = 'rgba(102, 102, 102, 1';
                ctx.fillText(tick.label, 16 + left + (segment * index)+ textWidth + 3, top - 7);
            });
        }
    }

    const topYScale = {
        id: 'topYScale',
        beforeDatasetsDraw(chart, args, pluginOptions) {
            const { ctx, chartArea: {left, top, height, right } , scales: {y} } = chart;
            //const weekdays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
            const tickLenght = y.ticks.length;
            const segment = height / tickLenght;

            y.ticks.forEach((tick, index) => {
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = 'black';
                // Top padding para Top label
                //const paddingTop = index === 0 ? 20 : 0;
                const yPos = top - 12 + height - (segment * index);

                ctx.fillText(tick.label, left -25, yPos);
            });
        }
    };

    const windSpeedColors = [];
    windSpeedData.map(speed => {
        if (speed >= 0.1 && speed < 3.0) {
            windSpeedColors.push('#5CA2D1');
        } else if (speed >= 3.0 && speed < 5.0) {
            windSpeedColors.push('#055D00');
        } else if (speed >= 5.0 && speed < 10.0) {
            windSpeedColors.push('#229A00');
        }else if (speed >= 10.0 && speed < 15.0) {
            windSpeedColors.push('#B2DF8A');
        }else if (speed >= 15.0 && speed < 20.0) {
            windSpeedColors.push('#FFF700');
        }else if (speed >= 20.0 && speed < 25.0) {
            windSpeedColors.push('#FFCC00');
        }else if (speed >= 25.0 && speed < 30.0) {
            windSpeedColors.push('#F99D59');
        }else if (speed >= 30.0) {
            windSpeedColors.push('#E31A1C');
        }
    })

    // Crea Chart.js
    const windChart = new Chart(windChartCtx, {
        type: 'scatter',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: '',
                    data: timeLabels.map((time, index) => ({
                        x: new Date(time),
                        y: windDirectionData[index],
                        category: direction_categorized[index],
                        gusts: windGustsData[index],
                    })),
                    backgroundColor: windSpeedColors,
                    borderColor: windSpeedColors,
                },
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
                x2: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        },
                    },
                    grid: {
                        tickColor: 'black',
                        boderColor: 'black',
                    },
                    ticks: {
                        display: true,
                    },
                    position: 'bottom',
                    title: {
                        display: false,
                        text: 'Tiempo',
                    },
                    suggestedMax: timeLabels[timeLabels.length -1],
                    suggestedMin: timeLabels[0],
                },
                y: {
                    ticks: {
                        min: 0,
                        max: 360,
                        stepSize: 45,
                        callback: function(value, index, values) {
                            return categories[index];
                        },
                        color: "transparent",
                        //
                    },
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Dirección',
                    },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 0,
                    },
                },
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
        plugins: [topScale, topYScale],
    });

    windChart.options.plugins.tooltip.callbacks = {
        label: function (context) {
            var label = context.dataset.label || '';
            if (label) {
                label += ": ";
            }
            label += context.parsed.y + '°';
            // Formato label rachas máximas
            if (context.dataset.data[context.dataIndex].gusts) {
                label += "\nRacha max.: " + context.dataset.data[context.dataIndex].gusts + ' Km/h';
            }
            return label.split('\n')
        }
    };
    windCharts.push(windChart);
}

// Chart temperatura and humedad
function createPrecipitationCloudsChart(data) {

    // Limpiamos los elementos por si tienen contenido previo (al hacer click de nuevo en el mapa para generar un nuevo graph)
    const precipitationChartCanvas = document.getElementById('precipitationChart');
    const cloudChartCanvas = document.getElementById('cloudChart');

    const precipitationChartCtx = precipitationChartCanvas.getContext('2d');
    const cloudChartCtx = cloudChartCanvas.getContext('2d');

    precipitationChartCtx.clearRect(0, 0, precipitationChartCanvas.width, precipitationChartCanvas.height);
    cloudChartCtx.clearRect(0, 0,cloudChartCanvas.width, cloudChartCanvas.height);

    if (precipitationCloudsChart) {
        precipitationCloudsChart.forEach(chart => {
            chart.destroy();
        });
    }

    const precipitationData = data.weatherData.hourly.precipitation;
    const precipitationProbData = data.weatherData.hourly.precipitation_probability;
    const cloudData = data.weatherData.hourly.cloudcover;

    // Formateamos las fechas para que tengan el formato correcto para Luxon y Chart
    const timeLabels = data.weatherData.hourly.time;

    // Variable para personalizar la escala de fecha superior para que muestre día de la semana y fecha con estilo
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
                ctx.fillText(weekdays[d.getDay(tick.value)], 16 + left + (segment * index), top - 10);

                const textWidth = ctx.measureText(weekdays[d.getDay(tick.value)]).width;

                ctx.font = '12px sans-serif';
                ctx.fillStyle = 'rgba(102, 102, 102, 1';
                ctx.fillText(tick.label, 16 + left + (segment * index)+ textWidth + 3, top - 10);
            });
        }
    }

    // Variable para aumentar margen de la leyenda superior
    const legendMargin = {
        id: 'legendMargin',
        beforeInit(chart, legend, options) {
            const fitValue = chart.legend.fit;

            chart.legend.fit = function fit() {
                fitValue.bind(chart.legend)();
                return this.height += 20;
            }
        }
    }

    // Crea Chart.js
    const precipitationChart = new Chart(precipitationChartCtx, {
        data: {
            labels: timeLabels,
            datasets: [
                {
                    type: 'line',
                    label: 'Precipitaciones (mm)',
                    data: precipitationData,
                    borderColor: 'rgba(44, 130, 201, 1)',
                    yAxisID: 'precipitation-y-axis',
                    //tension: 0.4,
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: 'rgba(44, 130, 201, 0.4)',
                    pointRadius: 2,
                },
                {
                    type: 'bar',
                    label: 'Probabilidad de precipitaciones (%)',
                    data: precipitationProbData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    yAxisID: 'precipitationprob-y-axis',
                    //borderWidth: 1, 
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                }
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x2: {
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
                },
                x:{
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'dd MMM'
                        },
                    },
                    grid: {
                        drawTicks: false,
                    },
                    ticks: {
                        display: false,
                    },
                    position: 'top',
                    title: {
                        display: false,
                    },
                },
                'precipitation-y-axis': {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Precipitaciones (mm)',
                    },
                },
                'precipitationprob-y-axis': {
                    position: 'right',
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Probabilidad precipitaciones (%)',
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        drawTicks: false,
                    },
                    ticks: {
                        display: true,
                    },
                    showLine: false,
                },
            },
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        generateLabels: (chart) => {
                            let pointStyle = [];
                            chart.data.datasets.forEach(dataset => {
                                if (dataset.type === 'line') {
                                    pointStyle.push('')
                                } else {
                                    pointStyle.push('rect');
                                }
                            });
                            return chart.data.datasets.map(
                                (dataset, index) => ({
                                    text: dataset.label,
                                    fillStyle: dataset.backgroundColor,
                                    strokeStyle: dataset.borderColor,
                                    pointStyle: 'circle',
                                    hidden: false,
                                })
                            )
                        },
                    },
                },
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
                title: {
                    display: true,
                    text: 'Precipitaciones y nubosidad',
                    font: {
                        weight: 'bold',
                        size: '15',
                    },
                    padding: '10',
                },
            },
        },
        plugins: [topScale, legendMargin]
    });

    const cloudChart = new Chart(cloudChartCtx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Nubosidad (%)',
                    data: cloudData,
                    borderColor: 'rgb(176, 196, 222, 1)',
                    yAxisID: 'cloud-y-axis',
                    borderWidth: 3,
                    fill: true,
                    backgroundColor: 'rgba(176, 196, 222, 0.6)',
                    pointRadius: 0,
                    tension: 0.4,
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
                y: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: false,
                        text: 'Nubosidad (%)',
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return value;
                        }
                    },
                    max: 100,
                    min: 0,
                },
                'cloud-y-axis': {
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nubosidad (%)',
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

    precipitationChart.options.plugins.tooltip.callbacks = {
        label: function (context) {
            var label = context.dataset.label || '';
            if (label) {
                label += ": ";
            }
            label += context.parsed.y + ' mm';
            return label
        }
    };

    cloudChart.options.plugins.tooltip.callbacks = {
        label: function (context) {
            var label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            label += context.parsed.y + '%'
            return label;
        }
    };

    cloudChart.options.plugins.tooltip.titleAlign = 'center';

    precipitationCloudsChart = [precipitationChart, cloudChart];
}


///////////////////////////////////////////////////////////////////////HOVMOLLER DIAGRAM EN PROGRESO//////////////////////////////////////////////////////////
/*function createHovmollerTemperatureChart(data) {

    // Limpiamos los elementos por si tienen contenido previo (al hacer click de nuevo en el mapa para generar un nuevo graph)
    const hovmollerTemperatureChartCanvas = document.getElementById('hovmollerTemperatureChart');

    const hovmollerTemperatureChartCtx = hovmollerTemperatureChartCanvas.getContext('2d');

    hovmollerTemperatureChartCtx.clearRect(0, 0, hovmollerTemperatureChartCanvas.width, hovmollerTemperatureChartCanvas.height);

    if (hovmollerTemperatureChart) {
        hovmollerTemperatureChart.forEach(chart => {
            chart.destroy();
        });
    }

    const temperatureData = data.weatherData.hourly.temperature_2m;
    const dewpointData = data.weatherData.hourly.dewpoint_2m;
    const timeLabels = data.weatherData.hourly.time;


    const traceCombined = {
        x: timeLabels,
        y: Array.from({ length: timeLabels.length }, (_, i) => i),
        z: [temperatureData, dewpointData],
        type: 'heatmap',
        colorscale: 'Viridis',
        showscale: true,
        name: 'Temperature (°C)',
        hovertemplate: 'Tiempo: %{x}<br>Index: %{y}<br>Temperatura: %{z}°C',
    };

    const layout = {
        title: 'Diagrama Hovmoller',
        xaxis: {
            title: 'Tiempo',
            tickvals: timeLabels,
            ticktext: timeLabels.map(date => new Date(date).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })),
        },
        yaxis: {
            title: 'Index',
            showline: false,
        },
        margin: {t: 40},
    };

    Plotly.newPlot('hovmollerTemperatureChartContainer', [traceCombined], layout);


    hovmollerTemperatureChart = [traceCombined];
}*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Funcionalidad botón para mostrar charts
function setupChartToggle() {
    const checkboxes = document.querySelectorAll('#chartToggleCheckboxes input[type="checkbox"]');
    let selectedCheckboxes = 2;

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                selectedCheckboxes++;
            } else {
                selectedCheckboxes--;
            }
            if (selectedCheckboxes > 2) {
                this.checked = false;
                selectedCheckboxes--;
            }

            checkboxes.forEach(otherCheckbox => {
                if (otherCheckbox !== this) {
                    otherCheckbox.disabled = selectedCheckboxes >= 2 && !otherCheckbox.checked;
                }
            });

            toggleCharts();
        });
    });
}

function toggleCharts() {
    const temperatureChartContainer = document.getElementById('temperatureChartContainer');
    const humidityChartContainer = document.getElementById('humidityChartContainer');
    const polarChartContainer = document.getElementById('polarChartContainer');
    const precipitationCloudChartContainer = document.getElementById('precipitationCloudChartContainer');
    const cloudChartContainer = document.getElementById('cloudChartContainer');

    const temperatureHumidityCheckbox = document.getElementById('temperatureHumidityCheckbox');
    const polarCheckbox = document.getElementById('polarCheckbox');
    const precipitationCloudCheckbox = document.getElementById('precipitationCloudCheckbox');

    // Check the state of each checkbox and show/hide corresponding containers
    if (temperatureHumidityCheckbox) {
        temperatureChartContainer.style.display = temperatureHumidityCheckbox.checked ? 'block' : 'none';
        humidityChartContainer.style.display = temperatureHumidityCheckbox.checked ? 'block' : 'none';
    }
    if (polarCheckbox) {
        polarChartContainer.style.display = polarCheckbox.checked ? 'block' : 'none';
    }
    if (precipitationCloudCheckbox) {
        precipitationCloudChartContainer.style.display = precipitationCloudCheckbox.checked ? 'block' : 'none';
        cloudChartContainer.style.display = precipitationCloudCheckbox.checked ? 'block' : 'none';
    }
}


// Selector lugares
document.getElementById('placeSelector').addEventListener('change', function () {
    const selectedPlace = this.value;
    // Get the coordinates for the selected place
    const coordinates = getCoordinatesForPlace(selectedPlace);

    handleMapClick({ latlng: L.latLng(coordinates.lat, coordinates.lng) });
});

function getCoordinatesForPlace(place) {
    // Define your predefined places and their coordinates
    const places = {
        place1: { lat: -28.734141, lng: -71.261603 },
        place2: { lat: -28.756765, lng: -70.840796 },
        place3: { lat: -28.86, lng: -70.11 },
        place4: { lat: -29.92, lng: -71.2 },
        place5: { lat: -30.041812, lng: -70.696002 },
        place6: { lat: -30.07801, lng: -70.406414 },
        place7: { lat: -30.616463, lng: -71.623589 },
        place8: { lat: -30.592853, lng: -71.176217 },
        place9: { lat: -30.64, lng: -70.63 },
        place10: { lat: -31.827902, lng: -71.483889 },
        place11: { lat: -31.65, lng: -71.17 },
        place12: { lat: -31.72, lng: -70.65 },
        place13: { lat: -33.06, lng: -71.55 },
        place14: { lat: -32.82, lng: -71.23 },
        place15: { lat: -32.8, lng: -70.57 },
        place16: { lat: -33.89, lng: -71.45 },
        place17: { lat: -33.44, lng: -70.74 },
        place18: { lat: -33.61, lng: -70.35 },
        place19: { lat: -34.4, lng: -71.99 },
        place20: { lat: -34.47, lng: -70.98 },
        place21: { lat: -34.558863, lng: -70.552021 },
        place22: { lat: -35.7, lng: -72.51 },
        place23: { lat: -35.53, lng: -71.47 },
        place24: { lat: -35.824991, lng: -70.821372 },
        place25: { lat: -36.722749, lng: -72.893586 },
        place26: { lat: -36.608984, lng: -72.112356 },
        place27: { lat: -36.89524, lng: -71.507987 },
        place28: { lat: -37.504235, lng: -73.403308 },
        place29: { lat: -37.47124, lng: -72.389588 },
        place30: { lat: -37.72829, lng: -71.372456 },
        place31: { lat: -37.87582, lng: -72.617415 },
        place32: { lat: -38.307531, lng: -73.286601 },
        place33: { lat: -38.444054, lng: -71.252385 },
        place34: { lat: -39.036237, lng: -73.220395 },
        place35: { lat: -39.024394, lng: -72.510049 },
        place36: { lat: -39.16, lng: -71.72 },
        place37: { lat: -39.81, lng: -73.25 },
        place38: { lat: -40.114952, lng: -72.609546 },
        place39: { lat: -40.241647, lng: -72.007745 },
        place40: { lat: -41.341177, lng: -73.776948 },
        place41: { lat: -41.431673, lng: -72.917233 },
        place42: { lat: -41.580992, lng: -72.161589 },
        place43: { lat: -42.526678, lng: -73.822196 },
        place44: { lat: -42.944771, lng: -72.672893 },
        place45: { lat: -43.342955, lng: -72.071093 },
        place46: { lat: -45.172706, lng: -74.013161 },
        place47: { lat: -45.410652, lng: -72.704457 },
        place48: { lat: -45.581974, lng: -72.047726 },
        place49: { lat: -46.324365, lng: -74.569955 },
        place50: { lat: -47.257114, lng: -72.566449 },
        place51: { lat: -46.519481, lng: -71.847851 },
        place52: { lat: -51.481609, lng: -73.871583 },
        place53: { lat: -53.149136, lng: -70.887739 },
        place54: { lat: -52.271114, lng: -70.252423 },
        place55: { lat: -51.16752, lng: -72.950731 },
        place56: { lat: -50.724941, lng: -72.436768 },
        place57: { lat: -53.813005, lng: -71.351734 },
        // Add more predefined places and coordinates as needed
    };

    // Return the coordinates for the selected place
    return places[place];
}

