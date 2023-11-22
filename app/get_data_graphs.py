import requests
import pandas as pd

# Obtener datos de meteo según las coordenadas
url = 'https://api.open-meteo.com/v1/forecast'

weather_df = pd.DataFrame()


def fetch_weather_data(lat, lng, forecast_days=1):
    params = {
        'latitude': lat,
        'longitude': lng,
        # 'start_date': '2023-04-05',
        # 'end_date': '2023-04-06',
        'hourly': 'temperature_2m,relativehumidity_2m,dewpoint_2m,windspeed_10m,winddirection_10m,windgusts_10m,precipitation_probability,precipitation,cloudcover',
        'models': 'gfs_global',
        'timezone': 'America/Santiago',
        'forecast_days': forecast_days  # Podemos darle el rango de días que queramos
    }
    try:
        response = requests.get(url, params=params)
        response.raise_for_status() # Check HTTP errors

        weather_data = response.json()
        print(f"parámetros obtenidos:{weather_data}")

        return weather_data
    except Exception as e:
        print(f"Error obtaining params from api-open-meteo: {e}")
        return None

