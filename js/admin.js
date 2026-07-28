// js/admin.js
// ================================================================
// АДМИН-ПАНЕЛЬ
// ================================================================

import { playerService } from './services/playerService.js'
import { tournamentService } from './services/tournamentService.js'
import { supabase } from './supabase.js'

// ================================================================
// СОСТОЯНИЕ
// ================================================================

const state = {
    players: [],
    tournaments: [],
    matches: [],
    currentTournamentId: null
}

// ================================================================
// НАВИГАЦИЯ ПО ВКЛАДКАМ
// ================================================================

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'))
        this.classList.add('active')

        const tabId = this.dataset.tab
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'))
        document.getElementById(`tab-${tabId}`).classList.add('active')

        switch (tabId) {
            case 'players': loadPlayers(); break
            case 'tournaments': loadTournaments(); break
            case 'matches': loadMatches(); break
        }
    })
})

// ================================================================
// ЗАГРУЗКА ИГРОКОВ
// ================================================================

async function loadPlayers() {
    const container = document.getElementById('playersList')

    try {
        const players = await playerService.getAll()
        state.players = players

        if (!players || players.length === 0) {
            container.innerHTML = '<div class="empty">Нет игроков</div>'
            return
        }

        container.innerHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Имя</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${players.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>
                                <button onclick="editPlayer('${p.id}')" style="background:none;border:none;color:#ffd700;cursor:pointer;">✏️</button>
                                <button onclick="deletePlayer('${p.id}')" style="background:none;border:none;color:#e85a5a;cursor:pointer;">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `

    } catch (error) {
        console.error('Ошибка загрузки игроков:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ЗАГРУЗКА ТУРНИРОВ
// ================================================================

async function loadTournaments() {
    const container = document.getElementById('tournamentsList')

    try {
        const tournaments = await tournamentService.getAll()
        state.tournaments = tournaments

        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = '<div class="empty">Нет турниров</div>'
            return
        }

        container.innerHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Дата</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${tournaments.map(t => `
                        <tr>
                            <td><strong>${t.name}</strong></td>
                            <td>${t.date}</td>
                            <td><span class="status-badge status-${t.status}">${t.status}</span></td>
                            <td>
                                <button onclick="editTournament('${t.id}')" style="background:none;border:none;color:#ffd700;cursor:pointer;">✏️</button>
                                <button onclick="deleteTournament('${t.id}')" style="background:none;border:none;color:#e85a5a;cursor:pointer;">🗑️</button>
                                <button onclick="generateSchedule('${t.id}')" style="background:none;border:none;color:#5dca8a;cursor:pointer;">📅</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `

    } catch (error) {
        console.error('Ошибка загрузки турниров:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ЗАГРУЗКА МАТЧЕЙ
// ================================================================

async function loadMatches() {
    const container = document.getElementById('matchesList')
    const select = document.getElementById('matchTournamentSelect')

    try {
        const tournaments = await tournamentService.getAll()
        state.tournaments = tournaments

        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = '<div class="empty">Нет турниров</div>'
            return
        }

        // Создаем выпадающий список
        let html = `
            <select id="tournamentSelect" onchange="selectTournament(this.value)" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;font-family:inherit;margin-bottom:16px;">
                <option value="">Выберите турнир</option>
                ${tournaments.map(t => `
                    <option value="${t.id}">${t.name} (${t.date})</option>
                `).join('')}
            </select>
            <div id="matchesContainer"><div class="empty">Выберите турнир</div></div>
        `

        container.innerHTML = html

    } catch (error) {
        console.error('Ошибка загрузки матчей:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ВЫБОР ТУРНИРА ДЛЯ МАТЧЕЙ
// ================================================================

window.selectTournament = async function(tournamentId) {
    const container = document.getElementById('matchesContainer')
    
    if (!tournamentId) {
        container.innerHTML = '<div class="empty">Выберите турнир</div>'
        return
    }

    try {
        const matches = await tournamentService.getMatches(tournamentId)

        if (!matches || matches.length === 0) {
            container.innerHTML = '<div class="empty">Нет матчей в этом турнире</div>'
            return
        }

        container.innerHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Матч</th>
                        <th>Счет</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${matches.map(m => `
                        <tr>
                            <td>${m.match_order}</td>
                            <td>${m.team_a?.name || '?'} vs ${m.team_b?.name || '?'}</td>
                            <td>${m.status === 'finished' ? `${m.score_a} : ${m.score_b}` : '—'}</td>
                            <td><span class="status-badge status-${m.status}">${m.status}</span></td>
                            <td>
                                <button onclick="editMatch('${m.id}')" style="background:none;border:none;color:#ffd700;cursor:pointer;">✏️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `

    } catch (error) {
        console.error('Ошибка загрузки матчей:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ДОБАВЛЕНИЕ ИГРОКА
// ================================================================

window.showAddPlayer = function() {
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '➕ Добавить игрока'

    content.innerHTML = `
        <form id="playerForm" onsubmit="addPlayer(event)">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Имя игрока</label>
                <input type="text" id="playerName" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить
            </button>
        </form>
    `

    modal.style.display = 'block'
}

window.addPlayer = async function(e) {
    e.preventDefault()
    const name = document.getElementById('playerName').value.trim()

    if (!name) {
        alert('Введите имя игрока')
        return
    }

    try {
        await playerService.create(name)
        closeModal()
        loadPlayers()
        alert('✅ Игрок добавлен!')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// СОЗДАНИЕ ТУРНИРА
// ================================================================

window.showAddTournament = function() {
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '➕ Создать турнир'

    content.innerHTML = `
        <form id="tournamentForm" onsubmit="addTournament(event)">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Название турнира</label>
                <input type="text" id="tournamentName" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Дата</label>
                <input type="date" id="tournamentDate" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Время</label>
                <input type="time" id="tournamentTime" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Создать
            </button>
        </form>
    `

    modal.style.display = 'block'
}

window.addTournament = async function(e) {
    e.preventDefault()
    const name = document.getElementById('tournamentName').value.trim()
    const date = document.getElementById('tournamentDate').value
    const time = document.getElementById('tournamentTime').value

    if (!name || !date || !time) {
        alert('Заполните все поля')
        return
    }

    try {
        await tournamentService.create({ name, date, time, status: 'scheduled' })
        closeModal()
        loadTournaments()
        alert('✅ Турнир создан!')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// ГЕНЕРАЦИЯ РАСПИСАНИЯ
// ================================================================

window.generateSchedule = async function(tournamentId) {
    if (!confirm('Создать расписание для этого турнира?')) return

    try {
        await tournamentService.generateSchedule(tournamentId)
        alert('✅ Расписание создано (12 матчей)!')
        loadTournaments()
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// УДАЛЕНИЕ
// ================================================================

window.deletePlayer = async function(id) {
    if (!confirm('Удалить игрока?')) return
    try {
        await playerService.delete(id)
        loadPlayers()
        alert('✅ Игрок удален')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

window.deleteTournament = async function(id) {
    if (!confirm('Удалить турнир?')) return
    try {
        await tournamentService.delete(id)
        loadTournaments()
        alert('✅ Турнир удален')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// МОДАЛЬНОЕ ОКНО
// ================================================================

window.closeModal = function() {
    document.getElementById('modal').style.display = 'none'
}

// Закрытие по клику вне окна
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal()
})

// ================================================================
// ЗАПУСК
// ================================================================

loadPlayers()
loadTournaments()
loadMatches()

console.log('✅ Админ-панель загружена')
