document.addEventListener('DOMContentLoaded', () => {
    // Элементы DOM
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const departureInput = document.getElementById('departure');
    const searchBtn = document.getElementById('search-btn');
    const errorDiv = document.getElementById('error-message');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const resultsCount = document.getElementById('results-count');

    // Установка даты по умолчанию (через 7 дней)
    const today = new Date();
    today.setDate(today.getDate() + 7);
    departureInput.valueAsDate = today;

    // Словарь для преобразования кодов авиакомпаний в названия
    const airlineNames = {
        "UT": "UTair",
        "SU": "Aeroflot",
        "S7": "S7 Airlines",
        "U6": "Ural Airlines",
        "DP": "Pobeda Airlines",
        "FV": "Rossiya Airlines",
        "D2": "Severstal Air"
    };

    // Основная функция поиска
    const searchFlights = async () => {
        const from = fromInput.value.trim().toUpperCase();
        const to = toInput.value.trim().toUpperCase();
        const date = departureInput.value;

        // Валидация
        if (!from || !to) {
            showError('Укажите города отправления и назначения');
            return;
        }
        
        // Проверка формата кодов аэропортов (3 буквы)
        if (from.length !== 3 || to.length !== 3) {
            showError('Коды аэропортов должны состоять из 3 букв');
            return;
        }
        
        // Проверка даты (не раньше сегодняшней)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        if (selectedDate < today) {
            showError('Дата вылета не может быть в прошлом');
            return;
        }

        loadingDiv.style.display = 'flex';
        resultsDiv.innerHTML = '';
        errorDiv.style.display = 'none';
        resultsCount.textContent = '';

        try {
            // Получаем реальные данные
            const flights = await fetchFlights(from, to, date);
            
            if (flights.length === 0) {
                resultsDiv.innerHTML = '<div class="no-results">Рейсов не найдено. Попробуйте другие параметры поиска.</div>';
                resultsCount.textContent = 'Найдено: 0 рейсов';
                return;
            }
            
            displayResults(flights, from, to);
        } catch (error) {
            console.error('Ошибка:', error);
            showError('Ошибка при получении данных. Пожалуйста, попробуйте позже.');
        } finally {
            loadingDiv.style.display = 'none';
        }
    };

    // Функция запроса к нашему серверу
    const fetchFlights = async (from, to, date) => {
        try {
            // Формируем URL для нашего сервера
            const apiUrl = `http://localhost:5000/api/flights?origin=${from}&destination=${to}&depart_date=${date}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            
            const data = await response.json();
            
            // Проверяем наличие ошибки от сервера
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Проверяем успешность ответа API
            if (!data.success) {
                throw new Error('API Error: ' + (data.message || 'Неизвестная ошибка'));
            }
            
            // Обработка структуры ответа API
            if (data.data && data.data[to]) {
                const flightsForDestination = data.data[to];
                
                // Преобразуем объект рейсов в массив
                const flightsArray = Object.values(flightsForDestination);
                
                // Фильтруем рейсы по дате вылета
                const filteredFlights = flightsArray.filter(flight => {
                    const departureDate = flight.departure_at.split('T')[0];
                    return departureDate === date;
                });
                
                // Преобразуем каждый рейс в нужный формат
                return filteredFlights.map(flight => {
                    // Преобразуем код авиакомпании в название
                    const airlineName = airlineNames[flight.airline] || flight.airline;
                    
                    // Рассчитываем время прибытия (вылет + 2 часа)
                    const departureTime = new Date(flight.departure_at);
                    const arrivalTime = new Date(departureTime.getTime() + 2 * 60 * 60000);
                    
                    return {
                        airline: airlineName,
                        price: flight.price,
                        departure_at: flight.departure_at,
                        arrival_at: arrivalTime.toISOString(),
                        origin: from,
                        destination: to,
                        transfers: 0
                    };
                });
            }
            return [];
        } catch (error) {
            console.error('Ошибка при запросе к серверу:', error);
            throw error;
        }
    };

    // Отображение результатов
    const displayResults = (flights, from, to) => {
        resultsCount.textContent = `Найдено: ${flights.length} рейсов`;
        
        resultsDiv.innerHTML = flights.map(flight => `
            <div class="flight-card">
                <div class="flight-header">
                    <span class="airline">${flight.airline}</span>
                    <span class="price">${flight.price.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="flight-details">
                    <div class="route">
                        <div class="departure">
                            <div class="time">${formatTime(flight.departure_at)}</div>
                            <div class="airport">${from}</div>
                        </div>
                        <div class="duration">${calculateDuration(flight.departure_at, flight.arrival_at)}</div>
                        <div class="arrival">
                            <div class="time">${formatTime(flight.arrival_at)}</div>
                            <div class="airport">${to}</div>
                        </div>
                    </div>
                </div>
                <div class="flight-info">
                    <span><i class="fas fa-calendar-alt"></i> ${formatDate(flight.departure_at)}</span>
                    <span><i class="fas fa-chair"></i> Без пересадок</span>
                </div>
            </div>
        `).join('');
    };

    // Вспомогательные функции
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'long'
        };
        return date.toLocaleDateString('ru-RU', options);
    };

    const calculateDuration = (departure, arrival) => {
        const dep = new Date(departure);
        const arr = new Date(arrival);
        const diff = arr - dep;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}ч ${minutes}м`;
    };

    const showError = (message) => {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    };

    // Обработчики событий
    searchBtn.addEventListener('click', searchFlights);

    // Обработчики подсказок
    document.querySelectorAll('.hint span').forEach(el => {
        el.addEventListener('click', () => {
            const code = el.getAttribute('data-code');
            toInput.value = code;
            errorDiv.style.display = 'none';
            searchFlights();
        });
    });

    // Первый поиск при загрузке
    searchFlights();
});