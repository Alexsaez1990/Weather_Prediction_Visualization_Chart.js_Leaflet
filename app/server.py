from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from get_data_graphs import fetch_weather_data

# Configuración servidor Flask para comunicar con el front-ed (Javascript)
app = Flask(__name__)
CORS(app)


@app.route('/')
def index():
    return render_template('mapa_graficos.html')


@app.route('/process', methods=['GET', 'POST'])
def process():
    if request.method == 'POST':
        try:
            data = request.get_json()
            lat = data['lat']
            lng = data['lng']
            days = data['days']
            # images = genera_windrose(lat, lng, days)
            print(f"Recibo en Python: Latitud: {lat}, Longitud: {lng}, Days: {days}")
            weather_data = fetch_weather_data(lat, lng, days)
            return jsonify({'weatherData': weather_data})

        except Exception as e:
            return jsonify({'error': str(e), 'success': False})
    else:
        try:
            lat = request.args.get('lat')
            lng = request.args.get('lng')
            days = request.args.get('days')
            # images = genera_windrose(lat, lng, days)
            print(f"Recibo en Python: Latitud: {lat}, Longitud: {lng}, Days: {days}")
            weather_data = fetch_weather_data(lat, lng, days)
            return jsonify({'weatherData': weather_data})

        except Exception as e:
            return jsonify({'error': str(e), 'success': False})



if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)