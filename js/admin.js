// js/admin.js
// ================================================================
// АДМИН-ПАНЕЛЬ
// ================================================================

import { supabase } from './supabase.js'

// ================================================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ================================================================

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
        // Обновляем кнопки
        document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'))
        this.classList.add('active')

        // Показываем нужную вкладку
        const tabId = this.dataset.tab
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'))
        document.getElementById(`tab-${tabId}`).classList.add('active')

        // Загружаем данные
        if (tabId === 'players') loadPlayers()
        if (tabId === 'tournaments') loadTournaments()
        if (tabId === 'matches') loadMatches()
    })
})

// ================================================================
// ЗАГРУЗКА ИГРОКОВ
// ================================================================

async function loadPlayers() {
    const container = document.getElementById('playersList')

    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name')

        if (error) throw error

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">Нет игроков</div>'
            return
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Имя</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(p => `
                            <tr>
                                <td><strong>${p.name}</strong></td>
                                <td>
                                    <button onclick="deletePlayer('${p.id}')" class="btn-danger">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `

    } catch (error) {
        console.error('Ошибка:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ЗАГРУЗКА ТУРНИРОВ
// ================================================================

async function loadTournaments() {
    const container = document.getElementById('tournamentsList')

    try {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: false })

        if (error) throw error

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">Нет турниров</div>'
            return
        }

        container.innerHTML = `
            <div class="table-wrap">
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
                        ${data.map(t => `
                            <tr>
                                <td><strong>${t.name}</strong></td>
                                <td>${t.date}</td>
                                <td><span class="status-badge status-${t.status}">${t.status}</span></td>
                                <td>
                                    <button onclick="deleteTournament('${t.id}')" class="btn-danger">🗑️</button>
                                    <button onclick="generateSchedule('${t.id}')" class="btn-success">📅 Расписание</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `

    } catch (error) {
        console.error('Ошибка:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ЗАГРУЗКА МАТЧЕЙ
// ================================================================

let currentTournamentId = null

async function loadMatches() {
    const container = document.getElementById('matchesList')

    try {
        // Сначала загружаем турниры для выпадающего списка
        const { data: tournaments, error: tournamentsError } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: false })

        if (tournamentsError) throw tournamentsError

        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = '<div class="empty">Нет турниров</div>'
            return
        }

        // Создаем выпадающий список
        let html = `
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Выберите турнир:</label>
                <select id="tournamentSelect" onchange="selectTournament(this.value)" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;font-family:inherit;">
                    <option value="">— Выберите турнир —</option>
                    ${tournaments.map(t => `
                        <option value="${t.id}">${t.name} (${t.date})</option>
                    `).join('')}
                </select>
            </div>
            <div id="matchesContainer"><div class="empty">Выберите турнир</div></div>
        `

        container.innerHTML = html

    } catch (error) {
        console.error('Ошибка:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// Выбор турнира
window.selectTournament = async function(tournamentId) {
    const container = document.getElementById('matchesContainer')
    
    if (!tournamentId) {
        container.innerHTML = '<div class="empty">Выберите турнир</div>'
        return
    }

    try {
        // Получаем матчи с данными команд
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *,
                team_a:team_a_id (id, name),
                team_b:team_b_id (id, name)
            `)
            .eq('tournament_id', tournamentId)
            .order('match_order')

        if (error) throw error

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">Нет матчей в этом турнире</div>'
            return
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Матч</th>
                            <th>Счет</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(m => `
                            <tr>
                                <td>${m.match_order}</td>
                                <td>${m.team_a?.name || '?'} vs ${m.team_b?.name || '?'}</td>
                                <td>${m.status === 'finished' ? `${m.score_a} : ${m.score_b}` : '—'}</td>
                                <td><span class="status-badge status-${m.status}">${m.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `

    } catch (error) {
        console.error('Ошибка:', error)
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
        <form onsubmit="addPlayer(event)">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Имя игрока</label>
                <input type="text" id="playerName" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить
            </button>
        </form>
    `

    modal.style.display = 'flex'
}

window.addPlayer = async function(e) {
    e.preventDefault()
    const name = document.getElementById('playerName').value.trim()

    if (!name) {
        alert('Введите имя игрока')
        return
    }

    try {
        const { error } = await supabase
            .from('players')
            .insert({ name })

        if (error) throw error

        closeModal()
        loadPlayers()
        alert('✅ Игрок добавлен!')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// ДОБАВЛЕНИЕ ТУРНИРА
// ================================================================

window.showAddTournament = function() {
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '➕ Создать турнир'

    content.innerHTML = `
        <form onsubmit="addTournament(event)">
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

    modal.style.display = 'flex'
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
        const { error } = await supabase
            .from('tournaments')
            .insert({ name, date, time, status: 'scheduled' })

        if (error) throw error

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
        const { error } = await supabase
            .rpc('generate_tournament_schedule', { p_tournament_id: tournamentId })

        if (error) throw error

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
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id)

        if (error) throw error

        loadPlayers()
        alert('✅ Игрок удален')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

window.deleteTournament = async function(id) {
    if (!confirm('Удалить турнир?')) return
    try {
        const { error } = await supabase
            .from('tournaments')
            .delete()
            .eq('id', id)

        if (error) throw error

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
