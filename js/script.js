document.addEventListener('DOMContentLoaded', () => {
  // Конфигурация
  const API_KEY = '0a855af76389d62285add478eefd38e9';
  
  // Элементы DOM
  const fromInput = document.getElementById('from');
  const toInput = document.getElementById('to');
  const departureInput = document.getElementById('departure');
  const searchBtn = document.getElementById('search-btn');
  const errorDiv = document.getElementById('error-message');
  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.getElementById('loading');

  // Установка даты по умолчанию (через 7 дней)
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  departureInput.valueAsDate = defaultDate;

  // Мок-данные для демонстрации
  const getMockFlights = (from, to, date) => {
    const baseDate = new Date(date);
    return [
      {
        airline: 'Aeroflot',
        price: 5600 + Math.floor(Math.random() * 2000),
        departure_at: new Date(baseDate.setHours(8, 0, 0)).toISOString(),
        return_at: new Date(baseDate.setHours(10, 30, 0)).toISOString(),
        origin: from,
        destination: to,
        transfers: 0
      },
      {
        airline: 'S7 Airlines',
        price: 4800 + Math.floor(Math.random() * 2000),
        departure_at: new Date(baseDate.setHours(12, 15, 0)).toISOString(),
        return_at: new Date(baseDate.setHours(14, 45, 0)).toISOString(),
        origin: from,
        destination: to,
        transfers: 0
      }
    ];
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

    loadingDiv.style.display = 'flex';
    resultsDiv.innerHTML = '';
    errorDiv.style.display = 'none';

    try {
      // 1. Пытаемся получить реальные данные
      let flights = await tryFetchRealData(from, to, date);
      
      // 2. Если не получилось, используем мок-данные
      if (!flights) {
        flights = getMockFlights(from, to, date);
        showWarning('Используются демонстрационные данные');
      }
      
      displayResults(flights, from, to);
    } catch (error) {
      console.error('Ошибка:', error);
      // 3. При любой ошибке показываем мок-данные
      const flights = getMockFlights(from, to, date);
      displayResults(flights, from, to);
      showError('Ошибка соединения. Показаны демонстрационные данные');
    } finally {
      loadingDiv.style.display = 'none';
    }
  };

  // Попытка получить реальные данные
  const tryFetchRealData = async (from, to, date) => {
    try {
      // Пробуем разные прокси-серверы последовательно
      const proxies = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
      ];
      
      const apiUrl = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${from}&destination=${to}&departure_at=${date}&currency=rub&token=${API_KEY}`;
      
      for (const proxy of proxies) {
        try {
          const response = await fetch(proxy + encodeURIComponent(apiUrl), {
            headers: {
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            return data.data || [];
          }
        } catch (e) {
          console.log(`Прокси ${proxy} не сработал, пробуем следующий`);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка при запросе к API:', error);
      return null;
    }
  };

  // Отображение результатов
  const displayResults = (flights, from, to) => {
    resultsDiv.innerHTML = flights.map(flight => `
      <div class="flight-card">
        <div class="flight-header">
          <span class="airline">${flight.airline || 'Авиакомпания'}</span>
          <span class="price">${flight.price.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div class="flight-details">
          <div class="route">
            <div class="departure">
              <div class="time">${formatTime(flight.departure_at)}</div>
              <div class="airport">${from}</div>
            </div>
            <div class="duration">${calculateDuration(flight.departure_at, flight.return_at)}</div>
            <div class="arrival">
              <div class="time">${formatTime(flight.return_at)}</div>
              <div class="airport">${to}</div>
            </div>
          </div>
        </div>
        <div class="flight-info">
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(flight.departure_at)}</span>
          <span><i class="fas fa-chair"></i> ${flight.transfers === 0 ? 'Без пересадок' : flight.transfers + ' пересадка'}</span>
        </div>
      </div>
    `).join('');
  };

  // Вспомогательные функции
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const calculateDuration = (departure, arrival) => {
    const diff = new Date(arrival) - new Date(departure);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
  };

  const showError = (message) => {
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-circle"></i> ${message}
      <div class="error-hint">
        Попробуйте:
        <ul>
          <li>Проверить интернет-соединение</li>
          <li>Использовать коды городов (MOW, LED)</li>
          <li>Попробовать позже</li>
        </ul>
      </div>
    `;
    errorDiv.style.display = 'block';
  };

  const showWarning = (message) => {
    errorDiv.innerHTML = `
      <i class="fas fa-info-circle"></i> ${message}
    `;
    errorDiv.style.display = 'block';
    errorDiv.style.backgroundColor = '#fff3cd';
    errorDiv.style.color = '#856404';
  };

  // Обработчики событий
  searchBtn.addEventListener('click', searchFlights);

  // Обработчики подсказок
  document.querySelectorAll('.code-hint').forEach(el => {
    el.addEventListener('click', () => {
      toInput.value = el.getAttribute('data-code');
      errorDiv.style.display = 'none';
    });
  });

  // Первый поиск при загрузке
  searchFlights();
});