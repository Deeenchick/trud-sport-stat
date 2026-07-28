// js/app.js
// ================================================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ
// ================================================================

import { playerService } from './services/playerService.js'
import { tournamentService } from './services/tournamentService.js'
import { statsService } from './services/statsService.js'

// ================================================================
// ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ================================================================

const state = {
    tournaments: [],
    players: [],
    stats: [],
    currentTournamentId: null,
    isLoaded: false
}

// ================================================================
// НАВИГАЦИЯ
// ================================================================

function switchPage(pageId) {
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
    
    // Показываем нужную
    document.getElementById(`page-${pageId}`).classList.add('active')
    
    // Обновляем кнопки
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.querySelector(`.nav-btn[data-page="${pageId}"]`).classList.add('active')
}

// Обработчики навигации
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const pageId = this.dataset.page
        switchPage(pageId)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    })
})

// ================================================================
// РЕНДЕРИНГ ТУРНИРОВ (С СОХРАНЕНИЕМ)
// ================================================================

function renderTournaments() {
    const container = document.getElementById('page-tournaments')
    const savedHTML = container.dataset.savedHTML

    // Если уже есть сохраненный HTML — используем его
    if (savedHTML && savedHTML.includes('tournament-item')) {
        container.innerHTML = savedHTML
        return
    }

    // Иначе рендерим
    container.innerHTML = `
        <div class="section-title">
            <i class="fas fa-calendar-alt"></i> Лента турниров
            <span class="section-sub" id="tournamentsCount">Загрузка...</span>
        </div>
        <div class="card" id="tournamentList">
            <div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>
        </div>
        <div id="tournamentDetail" style="display:none;"></div>
    `

    // Загружаем данные
    loadTournamentsData()
}

async function loadTournamentsData() {
    const container = document.getElementById('page-tournaments')
    const listContainer = document.getElementById('tournamentList')
    const countEl = document.getElementById('tournamentsCount')

    try {
        const tournaments = await tournamentService.getAll()
        state.tournaments = tournaments

        if (!tournaments || tournaments.length === 0) {
            listContainer.innerHTML = '<div class="empty">Нет турниров</div>'
            countEl.textContent = 'нет турниров'
            return
        }

        countEl.textContent = `${tournaments.length} турниров`

        listContainer.innerHTML = tournaments.map(t => `
            <div class="tournament-item" onclick="window.showTournamentDetail('${t.id}')">
                <span class="status-badge status-${t.status}">${t.status}</span>
                <span class="tournament-date">${t.date} · ${t.time}</span>
                <div class="tournament-stats">
                    <span>🏆 ${t.name}</span>
                </div>
                <span class="tournament-arrow"><i class="fas fa-chevron-right"></i></span>
            </div>
        `).join('')

        // Сохраняем HTML в dataset
        container.dataset.savedHTML = container.innerHTML

        // Сохраняем функцию в window
        window.showTournamentDetail = showTournamentDetail

    } catch (error) {
        console.error('Ошибка загрузки турниров:', error)
        listContainer.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
        countEl.textContent = 'ошибка'
    }
}

// ================================================================
// ДЕТАЛИ ТУРНИРА
// ================================================================

async function showTournamentDetail(tournamentId) {
    const detailContainer = document.getElementById('tournamentDetail')
    const container = document.getElementById('page-tournaments')
    
    // Если уже открыт этот турнир — закрываем
    if (state.currentTournamentId === tournamentId && detailContainer.style.display !== 'none') {
        detailContainer.style.display = 'none'
        state.currentTournamentId = null
        container.dataset.savedHTML = container.innerHTML
        return
    }

    state.currentTournamentId = tournamentId
    detailContainer.style.display = 'block'
    detailContainer.innerHTML = `
        <div class="card mt-12">
            <div class="flex-between">
                <h3 id="detailTitle" style="color:#ffd700;">Загрузка...</h3>
                <button onclick="closeTournamentDetail()" 
                        style="background:none;border:none;color:#7a8399;font-size:20px;cursor:pointer;">✕</button>
            </div>
            <div id="detailContent"><div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div></div>
        </div>
    `

    // Сохраняем состояние
    container.dataset.savedHTML = container.innerHTML

    try {
        const tournament = await tournamentService.getById(tournamentId)
        const table = await tournamentService.getTable(tournamentId)
        const matches = await tournamentService.getMatches(tournamentId)

        document.getElementById('detailTitle').textContent = `${tournament.name} — ${tournament.date}`

        let html = ''

        if (table && table.length > 0) {
            const winner = table.find(row => row.place === 1)
            html += `
                <div style="margin-bottom:16px;padding:12px;background:rgba(255,215,0,0.06);border-radius:12px;">
                    🏆 Победитель: <span style="color:#ffd700;font-weight:700;">${winner ? winner.team_name : '—'}</span>
                </div>
                <h4 style="margin:12px 0 8px;color:#b0baca;">Таблица команд</h4>
                <div class="table-wrap">
                    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
                        <tr style="color:#7a8399;border-bottom:1px solid #1e2530;">
                            <th style="padding:8px;text-align:left;">#</th>
                            <th style="padding:8px;text-align:left;">Команда</th>
                            <th style="padding:8px;text-align:center;">В</th>
                            <th style="padding:8px;text-align:center;">Н</th>
                            <th style="padding:8px;text-align:center;">П</th>
                            <th style="padding:8px;text-align:center;">ЗМ/ПМ</th>
                            <th style="padding:8px;text-align:center;">О</th>
                        </tr>
                        ${table.map(row => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                                <td style="padding:8px;font-weight:700;color:#ffd700;">${row.place}</td>
                                <td style="padding:8px;font-weight:600;">${row.team_name}</td>
                                <td style="padding:8px;text-align:center;">${row.wins}</td>
                                <td style="padding:8px;text-align:center;">${row.draws}</td>
                                <td style="padding:8px;text-align:center;">${row.losses}</td>
                                <td style="padding:8px;text-align:center;">${row.goals_for}/${row.goals_against}</td>
                                <td style="padding:8px;text-align:center;font-weight:700;color:#ffd700;">${row.points}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `
        }

        if (matches && matches.length > 0) {
            html += `
                <h4 style="margin:12px 0 8px;color:#b0baca;">Матчи</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
                    ${matches.map(m => `
                        <div style="background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:8px;text-align:center;">
                            <div style="font-size:13px;color:#7a8399;">${m.team_a?.name || '?'} vs ${m.team_b?.name || '?'}</div>
                            <div style="font-weight:700;color:#ffd700;font-size:16px;">
                                ${m.status === 'finished' ? `${m.score_a} : ${m.score_b}` : '—'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `
        }

        document.getElementById('detailContent').innerHTML = html || '<div class="empty">Нет данных</div>'

    } catch (error) {
        console.error('Ошибка загрузки деталей:', error)
        document.getElementById('detailContent').innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

function closeTournamentDetail() {
    const container = document.getElementById('page-tournaments')
    document.getElementById('tournamentDetail').style.display = 'none'
    state.currentTournamentId = null
    container.dataset.savedHTML = container.innerHTML
}

// ================================================================
// РЕНДЕРИНГ СТАТИСТИКИ
// ================================================================

function renderStats() {
    const container = document.getElementById('page-stats')
    const savedHTML = container.dataset.savedHTML

    if (savedHTML && savedHTML.includes('stats-table')) {
        container.innerHTML = savedHTML
        return
    }

    container.innerHTML = `
        <div class="section-title">
            <i class="fas fa-table"></i> Общая таблица игроков
            <span class="section-sub" id="statsCount">Загрузка...</span>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Игрок</th>
                            <th>Турниров</th>
                            <th>Матчи</th>
                            <th>Голы</th>
                            <th>Пасы</th>
                            <th>ИМП</th>
                            <th>Победы</th>
                            <th>PEI</th>
                        </tr>
                    </thead>
                    <tbody id="statsBody">
                        <tr><td colspan="8" class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `

    loadStatsData()
}

async function loadStatsData() {
    const container = document.getElementById('page-stats')
    const tbody = document.getElementById('statsBody')
    const countEl = document.getElementById('statsCount')

    try {
        const players = await statsService.getAllPlayersStats()
        state.players = players

        if (!players || players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">Нет игроков</td></tr>'
            countEl.textContent = 'нет игроков'
            return
        }

        countEl.textContent = `${players.length} игроков`
        players.sort((a, b) => (b.current_rating || 0) - (a.current_rating || 0))

        tbody.innerHTML = players.map(p => {
            const imp = p.total_matches > 0 
                ? (p.total_goals + p.total_assists) / (p.total_matches * 0.5 + 1) 
                : 0
            return `
                <tr>
                    <td><a class="player-name-link" onclick="alert('Профиль ${p.name}')">${p.name}</a></td>
                    <td>${p.total_tournaments || 0}</td>
                    <td>${p.total_matches || 0}</td>
                    <td>${p.total_goals || 0}</td>
                    <td>${p.total_assists || 0}</td>
                    <td>${imp.toFixed(2)}</td>
                    <td>${p.total_wins || 0}</td>
                    <td><strong>${(p.current_rating || 0).toFixed(2)}</strong></td>
                </tr>
            `
        }).join('')

        container.dataset.savedHTML = container.innerHTML

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error)
        tbody.innerHTML = `<tr><td colspan="8" class="error">Ошибка: ${error.message}</td></tr>`
        countEl.textContent = 'ошибка'
    }
}

// ================================================================
// РЕНДЕРИНГ ТОПОВ
// ================================================================

function renderTops() {
    const container = document.getElementById('page-tops')
    const savedHTML = container.dataset.savedHTML

    if (savedHTML && savedHTML.includes('hall-card')) {
        container.innerHTML = savedHTML
        return
    }

    container.innerHTML = `
        <div class="section-title"><i class="fas fa-star"></i> Зал славы</div>
        <div class="grid-4" id="hallOfFame">
            <div class="loading" style="grid-column:1/-1;"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>
        </div>

        <div class="section-title mt-24"><i class="fas fa-list-ol"></i> ТОП-10 бомбардиров</div>
        <div class="card" id="topScorersList">
            <div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>
        </div>

        <div class="section-title mt-24"><i class="fas fa-list-ol"></i> ТОП-10 по рейтингу (PEI)</div>
        <div class="card" id="topRatingList">
            <div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>
        </div>
    `

    loadTopsData()
}

async function loadTopsData() {
    const container = document.getElementById('page-tops')
    const hallContainer = document.getElementById('hallOfFame')
    const scorersContainer = document.getElementById('topScorersList')
    const ratingContainer = document.getElementById('topRatingList')

    try {
        const players = await statsService.getAllPlayersStats()
        state.stats = players

        if (!players || players.length === 0) {
            hallContainer.innerHTML = '<div class="empty" style="grid-column:1/-1;">Нет игроков</div>'
            scorersContainer.innerHTML = '<div class="empty">Нет данных</div>'
            ratingContainer.innerHTML = '<div class="empty">Нет данных</div>'
            return
        }

        const topScorers = [...players]
            .sort((a, b) => (b.total_goals || 0) - (a.total_goals || 0))
            .slice(0, 10)

        const topRating = [...players]
            .sort((a, b) => (b.current_rating || 0) - (a.current_rating || 0))
            .slice(0, 10)

        // Зал славы
        hallContainer.innerHTML = [
            { icon: '🥇', name: topScorers[0]?.name || '—', desc: 'Лучший бомбардир', value: `${topScorers[0]?.total_goals || 0} голов` },
            { icon: '👑', name: topRating[0]?.name || '—', desc: 'Лучший PEI', value: `${(topRating[0]?.current_rating || 0).toFixed(2)}` },
            { icon: '⚡', name: topScorers[1]?.name || '—', desc: '2-й бомбардир', value: `${topScorers[1]?.total_goals || 0} голов` },
            { icon: '🏅', name: topRating[1]?.name || '—', desc: '2-й по PEI', value: `${(topRating[1]?.current_rating || 0).toFixed(2)}` }
        ].map(h => `
            <div class="hall-card">
                <div class="hall-icon">${h.icon}</div>
                <div class="hall-name">${h.name}</div>
                <div class="hall-desc">${h.desc}</div>
                <div class="hall-value">${h.value}</div>
            </div>
        `).join('')

        // ТОП-10 бомбардиров
        scorersContainer.innerHTML = topScorers.map((p, i) => `
            <div class="top-row">
                <span class="top-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                <span class="top-name">${p.name}</span>
                <span class="top-value">${p.total_goals || 0} ⚽</span>
            </div>
        `).join('')

        // ТОП-10 по PEI
        ratingContainer.innerHTML = topRating.map((p, i) => `
            <div class="top-row">
                <span class="top-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                <span class="top-name">${p.name}</span>
                <span class="top-value">${(p.current_rating || 0).toFixed(2)}</span>
            </div>
        `).join('')

        container.dataset.savedHTML = container.innerHTML

    } catch (error) {
        console.error('Ошибка загрузки ТОПов:', error)
        hallContainer.innerHTML = `<div class="error" style="grid-column:1/-1;">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// РЕНДЕРИНГ ПРОФИЛЕЙ
// ================================================================

function renderPlayers() {
    const container = document.getElementById('page-profile')
    const savedHTML = container.dataset.savedHTML

    if (savedHTML && savedHTML.includes('player-card')) {
        container.innerHTML = savedHTML
        return
    }

    container.innerHTML = `
        <div class="section-title">
            <i class="fas fa-id-card"></i> Галерея игроков
            <span class="section-sub" id="playersCount">Загрузка...</span>
        </div>
        <div class="card">
            <div class="player-grid" id="playerGrid">
                <div class="loading" style="grid-column:1/-1;"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>
            </div>
        </div>
    `

    loadPlayersData()
}

async function loadPlayersData() {
    const container = document.getElementById('page-profile')
    const grid = document.getElementById('playerGrid')
    const countEl = document.getElementById('playersCount')

    try {
        const players = await statsService.getAllPlayersStats()

        if (!players || players.length === 0) {
            grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">Нет игроков</div>'
            countEl.textContent = 'нет игроков'
            return
        }

        countEl.textContent = `${players.length} игроков`
        players.sort((a, b) => (b.current_rating || 0) - (a.current_rating || 0))

        grid.innerHTML = players.map(p => {
            const initials = p.name.split(' ').map(w => w[0]).join('')
            return `
                <div class="player-card" onclick="alert('Профиль ${p.name}\\nPEI: ${(p.current_rating || 0).toFixed(2)}\\nГолы: ${p.total_goals || 0}\\nПасы: ${p.total_assists || 0}')">
                    <div class="player-avatar">${initials}</div>
                    <div class="player-name">${p.name}</div>
                    <div class="player-rating">${(p.current_rating || 0).toFixed(2)}</div>
                    <div class="player-label">PEI</div>
                </div>
            `
        }).join('')

        container.dataset.savedHTML = container.innerHTML

    } catch (error) {
        console.error('Ошибка загрузки игроков:', error)
        grid.innerHTML = `<div class="error" style="grid-column:1/-1;">Ошибка: ${error.message}</div>`
        countEl.textContent = 'ошибка'
    }
}

// ================================================================
// ОБНОВЛЕННАЯ НАВИГАЦИЯ С СОХРАНЕНИЕМ
// ================================================================

// Переопределяем обработчики
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const pageId = this.dataset.page

        // Обновляем кнопки
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
        this.classList.add('active')

        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))

        // Показываем нужную
        const pageElement = document.getElementById(`page-${pageId}`)
        pageElement.classList.add('active')

        // Загружаем данные, если страница пустая
        if (!pageElement.dataset.savedHTML || !pageElement.dataset.savedHTML.includes('card')) {
            switch (pageId) {
                case 'tournaments': renderTournaments(); break
                case 'stats': renderStats(); break
                case 'tops': renderTops(); break
                case 'profile': renderPlayers(); break
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
    })
})

// ================================================================
// ЗАПУСК
// ================================================================

// Загружаем первую страницу
renderTournaments()

console.log('✅ СпортСтат приложение загружено!')
