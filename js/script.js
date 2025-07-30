document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const errorMessage = document.getElementById('error-message');
    const flightModal = document.getElementById('flight-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');


    clearBtn.addEventListener('click', function() {
        document.getElementById('from').value = '';
        document.getElementById('to').value = '';
        document.getElementById('departure').value = '';
        document.getElementById('return').value = '';
        results.innerHTML = '';
        errorMessage.style.display = 'none';
    });

    searchBtn.addEventListener('click', async function() {
        const from = document.getElementById('from').value.trim();
        const to = document.getElementById('to').value.trim();
        const departure = document.getElementById('departure').value;
        const returnDate = document.getElementById('return').value;

        if (!from || !to || !departure) {
            showError('Пожалуйста, заполните обязательные поля: Откуда, Куда и Дата вылета');
            return;
        }

        loading.style.display = 'flex';
        results.innerHTML = '';
        errorMessage.style.display = 'none';
        
        try {
            const mockData = await mockApiRequest(from, to, departure, returnDate);
            displayResults(mockData);
        } catch (error) {
            showError('Произошла ошибка при поиске рейсов. Пожалуйста, попробуйте позже.');
            console.error('API Error:', error);
        } finally {
            loading.style.display = 'none';
        }
    });
    function mockApiRequest(from, to, departureDate, returnDate) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(generateMockFlights(from, to, departureDate, returnDate));
            }, 1500);
        });
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function displayResults(flights) {
        if (flights.length === 0) {
            results.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-plane-slash" style="font-size: 3rem; color: var(--primary-light); margin-bottom: 15px;"></i>
                    <h3>Рейсов по вашему запросу не найдено</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
            return;
        }
        
        flights.forEach(flight => {
            const flightCard = document.createElement('div');
            flightCard.className = 'flight-card';
            flightCard.dataset.id = flight.id;
            
            flightCard.innerHTML = `
                <div class="flight-header">
                    <span class="airline">${flight.airline}</span>
                    <span class="price">${flight.price.toLocaleString()} ₽</span>
                </div>
                
                <div class="flight-details">
                    <div class="route">
                        <div>
                            <div class="time">${flight.departureTime}</div>
                            <div class="airport">${flight.from}</div>
                        </div>
                        <div>
                            <div class="time">${flight.arrivalTime}</div>
                            <div class="airport">${flight.to}</div>
                        </div>
                    </div>
                    
                    <div class="duration">
                        <i class="fas fa-clock"></i> ${flight.duration}
                    </div>
                    
                    <div class="flight-info">
                        <span>Рейс: ${flight.flightNumber}</span>
                        <span>${flight.departureDate}</span>
                    </div>
                </div>
                
                <div class="view-details">
                    <button class="view-details-btn" data-id="${flight.id}">
                        <i class="fas fa-info-circle"></i> Подробнее
                    </button>
                </div>
            `;
            
            results.appendChild(flightCard);
        });
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const flightId = this.dataset.id;
                const flight = flights.find(f => f.id === flightId);
                showFlightDetails(flight);
            });
        });
        document.querySelectorAll('.flight-card').forEach(card => {
            card.addEventListener('click', function() {
                const flightId = this.dataset.id;
                const flight = flights.find(f => f.id === flightId);
                showFlightDetails(flight);
            });
        });
    }

    function showFlightDetails(flight) {
        modalTitle.textContent = `Рейс ${flight.flightNumber}`;
        
        modalContent.innerHTML = `
            <div class="modal-flight-details">
                <div class="modal-flight-row">
                    <span class="modal-label">Авиакомпания:</span>
                    <span>${flight.airline}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Маршрут:</span>
                    <span>${flight.from} → ${flight.to}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Вылет:</span>
                    <span>${flight.departureTime}, ${flight.departureDate}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Прибытие:</span>
                    <span>${flight.arrivalTime}, ${flight.arrivalDate}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Время в пути:</span>
                    <span>${flight.duration}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Тип самолета:</span>
                    <span>${flight.aircraft}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Класс:</span>
                    <span>${flight.class}</span>
                </div>
                
                <div class="modal-flight-row">
                    <span class="modal-label">Цена:</span>
                    <span style="font-weight: 700; color: var(--primary-color);">${flight.price.toLocaleString()} ₽</span>
                </div>
                
                ${flight.returnDate ? `
                <div class="modal-flight-row">
                    <span class="modal-label">Обратный рейс:</span>
                    <span>${flight.returnDate}</span>
                </div>
                ` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn btn-primary" style="padding: 10px 20px;">
                    <i class="fas fa-ticket-alt"></i> Купить билет
                </button>
            </div>
        `;
        
        flightModal.classList.add('show');
    }
    closeModal.addEventListener('click', function() {
        flightModal.classList.remove('show');
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === flightModal) {
            flightModal.classList.remove('show');
        }
    });
    function generateMockFlights(from, to, departureDate, returnDate) {
        const airlines = [
            { name: 'Аэрофлот', logo: 'SU' },
            { name: 'S7 Airlines', logo: 'S7' },
            { name: 'Победа', logo: 'DP' },
            { name: 'Utair', logo: 'UT' },
            { name: 'Ural Airlines', logo: 'U6' }
        ];
        
        const aircrafts = ['Boeing 737-800', 'Airbus A320', 'Boeing 777-300ER', 'Airbus A321', 'Sukhoi Superjet 100'];
        const classes = ['Эконом', 'Премиум-эконом', 'Бизнес', 'Первый класс'];
        const prices = [4500, 5200, 6800, 7100, 8900, 9200, 11500, 12500, 15800, 18200];
        const times = ['08:20', '10:45', '12:30', '15:15', '18:40', '21:20'];
        const durations = ['1ч 30м', '2ч 15м', '3ч', '1ч 45м', '2ч 30м'];
        
        const flights = [];
        const count = Math.floor(Math.random() * 4) + 3; 
        
        for (let i = 0; i < count; i++) {
            const airline = airlines[Math.floor(Math.random() * airlines.length)];
            const depTime = times[Math.floor(Math.random() * times.length)];
            const arrTime = addDuration(depTime, durations[Math.floor(Math.random() * durations.length)]);
            const price = prices[Math.floor(Math.random() * prices.length)];
            const flightClass = classes[Math.floor(Math.random() * classes.length)];
            
            flights.push({
                id: generateId(),
                airline: airline.name,
                flightNumber: `${airline.logo} ${Math.floor(Math.random() * 9000) + 1000}`,
                price: price,
                departureTime: depTime,
                arrivalTime: arrTime,
                from: from,
                to: to,
                duration: durations[Math.floor(Math.random() * durations.length)],
                departureDate: formatDate(departureDate),
                arrivalDate: formatDate(addDays(departureDate, 1)),
                aircraft: aircrafts[Math.floor(Math.random() * aircrafts.length)],
                class: flightClass,
                returnDate: returnDate ? formatDate(returnDate) : null
            });
        }

        return flights.sort((a, b) => a.price - b.price);
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    function addDuration(time, duration) {
        const [hours, mins] = time.split(':').map(Number);
        const [durHours, durMins] = duration.match(/\d+/g).map(Number);
        
        let totalHours = hours + durHours;
        let totalMins = mins + durMins;
        
        if (totalMins >= 60) {
            totalHours += Math.floor(totalMins / 60);
            totalMins = totalMins % 60;
        }
        
        if (totalHours >= 24) {
            totalHours = totalHours % 24;
        }
        
        return `${String(totalHours).padStart(2, '0')}:${String(totalMins).padStart(2, '0')}`;
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    function addDays(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }
});
