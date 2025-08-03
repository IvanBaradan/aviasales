from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Разрешаем запросы со всех доменов

# Ваш API-ключ Travelpayouts
API_KEY = '0a855af76389d62285add478eefd38e9'
API_URL = 'https://api.travelpayouts.com/v1/prices/cheap'

@app.route('/api/flights', methods=['GET'])
def get_flights():
    # Получаем параметры из запроса
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    depart_date = request.args.get('depart_date')
    
    # Параметры для запроса к Travelpayouts
    params = {
        'origin': origin,
        'destination': destination,
        'depart_date': depart_date,
        'token': API_KEY
    }
    
    try:
        # Выполняем запрос к API Travelpayouts
        response = requests.get(API_URL, params=params)
        response.raise_for_status()  # Проверяем на ошибки
        
        # Возвращаем данные клиенту
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        # В случае ошибки возвращаем сообщение
        return jsonify({
            'error': 'Ошибка при запросе к Travelpayouts',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)