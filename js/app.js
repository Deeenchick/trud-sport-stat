import { supabase } from './supabase.js';
import { tournamentService } from './services/tournamentService.js';
import { playerService } from './services/playerService.js';
import { statsService } from './services/statsService.js';

// Глобальное состояние
let currentTournamentId = null;
let allTournaments = [];
let allPlayers = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    loadTournaments();
    loadPlayers();
    setupEventListeners();
});

// Загрузка турниров
async function loadTournaments() {
    const container = document.getElementById('tournamentsList');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading">Загрузка турниров...</div>';
        const tournaments = await tournamentService.getAll();
        allTournaments = tournaments;
        
        if (tournaments.length === 0) {
            container.innerHTML = '<div class="empty-state">Турниры не найдены</div>';
            return;
        }

        container.innerHTML = tournaments.map(t => `
            <div class="tournament-card" data-id="${t.id}">
                <h3>${t.name}</h3>
                <p class="date">${new Date(t.start_date).toLocaleDateString()} - ${new Date(t.end_date).toLocaleDateString()}</p>
                <p class="status ${t.status}">${getStatusText(t.status)}</p>
                <button class="btn-details" onclick="showTournamentDetail(${t.id})">Подробнее</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки турниров:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки турниров</div>';
    }
}

// Загрузка игроков
async function loadPlayers() {
    const container = document.getElementById('playersList');
    if (!container) return;

    try {
        container.innerHTML = '<div class="loading">Загрузка игроков...</div>';
        const players = await playerService.getAll();
        allPlayers = players;
        
        if (players.length === 0) {
            container.innerHTML = '<div class="empty-state">Игроки не найдены</div>';
            return;
        }

        container.innerHTML = players.map(p => `
            <div class="player-card">
                <h3>${p.name}</h3>
                <p class="team">${p.team || 'Без команды'}</p>
                <p class="position">${getPositionText(p.position)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки игроков:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки игроков</div>';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики для навигации
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            showSection(target);
            
            // Обновление активного класса
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Переключение секций
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });
}

// Отображение деталей турнира
async function showTournamentDetail(tournamentId) {
    currentTournamentId = tournamentId;
    const container = document.getElementById('tournamentDetail');
    const listContainer = document.getElementById('tournamentsList');
    
    if (!container || !listContainer) return;

    try {
        listContainer.style.display = 'none';
        container.style.display = 'block';
        container.innerHTML = '<div class="loading">Загрузка деталей турнира...</div>';

        const tournament = await tournamentService.getById(tournamentId);
        if (!tournament) {
            container.innerHTML = '<div class="error">Турнир не найден</div>';
            return;
        }

        const stats = await statsService.getByTournament(tournamentId);
        const topScorers = stats
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 5);

        container.innerHTML = `
            <div class="detail-header">
                <button class="btn-back" onclick="closeTournamentDetail()">← Назад</button>
                <h2>${tournament.name}</h2>
                <p class="date">${new Date(tournament.start_date).toLocaleDateString()} - ${new Date(tournament.end_date).toLocaleDateString()}</p>
                <p class="status ${tournament.status}">${getStatusText(tournament.status)}</p>
            </div>
            
            <div class="detail-content">
                <div class="stats-section">
                    <h3>Лучшие бомбардиры</h3>
                    ${topScorers.length > 0 ? `
                        <table class="stats-table">
                            <thead>
                                <tr>
                                    <th>Игрок</th>
                                    <th>Голы</th>
                                    <th>Передачи</th>
                                    <th>Очки</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topScorers.map(s => `
                                    <tr>
                                        <td>${s.player_name}</td>
                                        <td>${s.goals}</td>
                                        <td>${s.assists}</td>
                                        <td>${s.points}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Статистика пока отсутствует</p>'}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка загрузки деталей турнира:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки деталей турнира</div>';
    }
}

// Закрытие деталей турнира и возврат к списку
function closeTournamentDetail() {
    const container = document.getElementById('tournamentDetail');
    const listContainer = document.getElementById('tournamentsList');
    
    if (container && listContainer) {
        container.style.display = 'none';
        container.innerHTML = '';
        listContainer.style.display = 'block';
        currentTournamentId = null;
        
        // Перезагружаем список турниров для актуальности
        loadTournaments();
    }
}

// Вспомогательные функции
function getStatusText(status) {
    const statuses = {
        'upcoming': 'Предстоящий',
        'active': 'Активный',
        'completed': 'Завершен',
        'cancelled': 'Отменен'
    };
    return statuses[status] || status;
}

function getPositionText(position) {
    const positions = {
        'forward': 'Нападающий',
        'midfielder': 'Полузащитник',
        'defender': 'Защитник',
        'goalkeeper': 'Вратарь'
    };
    return positions[position] || position;
}

// Экспорт функций в глобальную область видимости для доступа из HTML
window.showTournamentDetail = showTournamentDetail;
window.closeTournamentDetail = closeTournamentDetail;
