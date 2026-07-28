// js/admin.js
// ================================================================
// АДМИН-ПАНЕЛЬ (с редактированием)
// ================================================================

import { supabase } from './supabase.js'

// ================================================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ================================================================

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'))
        this.classList.add('active')

        const tabId = this.dataset.tab
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'))
        document.getElementById(`tab-${tabId}`).classList.add('active')

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
                            <th style="text-align:center;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(p => `
                            <tr>
                                <td><strong>${p.name}</strong></td>
                                <td style="text-align:center;">
                                    <button onclick="editPlayer('${p.id}', '${p.name}')" class="btn-warning" style="margin-right:8px;">✏️</button>
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
                            <th>Время</th>
                            <th>Статус</th>
                            <th style="text-align:center;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(t => `
                            <tr>
                                <td><strong>${t.name}</strong></td>
                                <td>${t.date}</td>
                                <td>${t.time}</td>
                                <td><span class="status-badge status-${t.status}">${t.status}</span></td>
                                <td style="text-align:center;">
                                    <button onclick="editTournament('${t.id}')" class="btn-warning" style="margin-right:8px;">✏️</button>
                                    <button onclick="deleteTournament('${t.id}')" class="btn-danger" style="margin-right:8px;">🗑️</button>
                                    <button onclick="generateSchedule('${t.id}')" class="btn-success">📅</button>
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
        const { data: tournaments, error: tournamentsError } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: false })

        if (tournamentsError) throw tournamentsError

        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = '<div class="empty">Нет турниров</div>'
            return
        }

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

window.selectTournament = async function(tournamentId) {
    const container = document.getElementById('matchesContainer')
    currentTournamentId = tournamentId
    
    if (!tournamentId) {
        container.innerHTML = '<div class="empty">Выберите турнир</div>'
        return
    }

    try {
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
            container.innerHTML = `
                <div class="empty">Нет матчей в этом турнире</div>
                <button onclick="generateSchedule('${tournamentId}')" class="btn-success" style="margin-top:12px;padding:10px 20px;">
                    📅 Создать расписание
                </button>
            `
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
                            <th style="text-align:center;">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(m => `
                            <tr>
                                <td>${m.match_order}</td>
                                <td>${m.team_a?.name || '?'} vs ${m.team_b?.name || '?'}</td>
                                <td>${m.status === 'finished' ? `${m.score_a} : ${m.score_b}` : '—'}</td>
                                <td><span class="status-badge status-${m.status}">${m.status}</span></td>
                                <td style="text-align:center;">
                                    <button onclick="editMatch('${m.id}')" class="btn-warning">✏️</button>
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
// РЕДАКТИРОВАНИЕ ИГРОКА
// ================================================================

window.editPlayer = function(id, currentName) {
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '✏️ Редактировать игрока'

    content.innerHTML = `
        <form onsubmit="updatePlayer(event, '${id}')">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Имя игрока</label>
                <input type="text" id="editPlayerName" value="${currentName}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить
            </button>
        </form>
    `

    modal.style.display = 'flex'
}

window.updatePlayer = async function(e, id) {
    e.preventDefault()
    const name = document.getElementById('editPlayerName').value.trim()

    if (!name) {
        alert('Введите имя игрока')
        return
    }

    try {
        const { error } = await supabase
            .from('players')
            .update({ name })
            .eq('id', id)

        if (error) throw error

        closeModal()
        loadPlayers()
        alert('✅ Игрок обновлен!')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// РЕДАКТИРОВАНИЕ ТУРНИРА
// ================================================================

window.editTournament = async function(id) {
    // Получаем данные турнира
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        alert('Ошибка загрузки данных: ' + error.message)
        return
    }

    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '✏️ Редактировать турнир'

    content.innerHTML = `
        <form onsubmit="updateTournament(event, '${id}')">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Название турнира</label>
                <input type="text" id="editTournamentName" value="${data.name}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Дата</label>
                <input type="date" id="editTournamentDate" value="${data.date}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Время</label>
                <input type="time" id="editTournamentTime" value="${data.time}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Статус</label>
                <select id="editTournamentStatus" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                    <option value="scheduled" ${data.status === 'scheduled' ? 'selected' : ''}>📅 Запланирован</option>
                    <option value="live" ${data.status === 'live' ? 'selected' : ''}>🟢 Идет</option>
                    <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>✅ Завершен</option>
                </select>
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить
            </button>
        </form>
    `

    modal.style.display = 'flex'
}

window.updateTournament = async function(e, id) {
    e.preventDefault()
    
    const name = document.getElementById('editTournamentName').value.trim()
    const date = document.getElementById('editTournamentDate').value
    const time = document.getElementById('editTournamentTime').value
    const status = document.getElementById('editTournamentStatus').value

    if (!name || !date || !time) {
        alert('Заполните все поля')
        return
    }

    try {
        console.log('🔄 Обновляем турнир:', { id, name, date, time, status })

        const { data, error } = await supabase
            .from('tournaments')
            .update({ 
                name: name, 
                date: date, 
                time: time, 
                status: status 
            })
            .eq('id', id)
            .select()

        if (error) {
            console.error('❌ Ошибка Supabase:', error)
            alert('Ошибка: ' + error.message)
            return
        }

        console.log('✅ Турнир обновлен:', data)

        closeModal()
        
        // Принудительно перезагружаем список турниров
        await loadTournaments()
        
        alert('✅ Турнир обновлен!')
        
    } catch (error) {
        console.error('❌ Ошибка:', error)
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// РЕДАКТИРОВАНИЕ МАТЧА
// ================================================================

window.editMatch = async function(id) {
    // Получаем данные матча
    const { data, error } = await supabase
        .from('matches')
        .select(`
            *,
            team_a:team_a_id (id, name),
            team_b:team_b_id (id, name)
        `)
        .eq('id', id)
        .single()

    if (error) {
        alert('Ошибка загрузки данных: ' + error.message)
        return
    }

    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = `✏️ Редактировать матч: ${data.team_a?.name} vs ${data.team_b?.name}`

    // Получаем список игроков для выбора гола
    const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .order('name')

    if (playersError) {
        alert('Ошибка загрузки игроков')
        return
    }

    const playerOptions = players.map(p => 
        `<option value="${p.id}">${p.name}</option>`
    ).join('')

    content.innerHTML = `
        <form onsubmit="updateMatch(event, '${id}')">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                <div>
                    <label style="display:block;color:#7a8399;margin-bottom:6px;">${data.team_a?.name || '?'}</label>
                    <input type="number" id="editScoreA" value="${data.score_a}" min="0" max="20" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;font-size:20px;text-align:center;">
                </div>
                <div>
                    <label style="display:block;color:#7a8399;margin-bottom:6px;">${data.team_b?.name || '?'}</label>
                    <input type="number" id="editScoreB" value="${data.score_b}" min="0" max="20" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;font-size:20px;text-align:center;">
                </div>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Статус</label>
                <select id="editMatchStatus" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                    <option value="scheduled" ${data.status === 'scheduled' ? 'selected' : ''}>📅 Запланирован</option>
                    <option value="live" ${data.status === 'live' ? 'selected' : ''}>🟢 Идет</option>
                    <option value="finished" ${data.status === 'finished' ? 'selected' : ''}>✅ Завершен</option>
                </select>
            </div>

            <div style="margin-bottom:16px;padding:12px;background:rgba(255,215,0,0.05);border-radius:8px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">⚽ Добавить гол (кто забил):</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <select id="goalPlayer" style="width:100%;padding:8px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                        <option value="">— Выберите игрока —</option>
                        ${playerOptions}
                    </select>
                    <select id="goalAssist" style="width:100%;padding:8px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                        <option value="">— Ассистент (опционально) —</option>
                        ${playerOptions}
                    </select>
                </div>
                <button type="button" onclick="addGoalToMatch('${id}')" class="btn-success" style="padding:6px 16px;">➕ Добавить гол</button>
            </div>

            <div id="matchGoalsList" style="margin-bottom:16px;">
                <!-- Список голов будет загружен -->
            </div>

            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить изменения
            </button>
        </form>
    `

    modal.style.display = 'flex'

    // Загружаем голы для матча
    loadMatchGoals(id)
}

async function loadMatchGoals(matchId) {
    const container = document.getElementById('matchGoalsList')
    
    try {
        const { data, error } = await supabase
            .from('goals')
            .select(`
                id,
                player:player_id (id, name),
                assist:assist_id (id, name)
            `)
            .eq('match_id', matchId)

        if (error) throw error

        if (!data || data.length === 0) {
            container.innerHTML = '<div style="color:#7a8399;font-size:13px;">Голов пока нет</div>'
            return
        }

        container.innerHTML = `
            <div style="color:#ffd700;font-weight:700;margin-bottom:6px;">⚽ Голы (${data.length}):</div>
            ${data.map(g => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:rgba(255,255,255,0.03);border-radius:4px;margin-bottom:4px;">
                    <span>⚽ ${g.player?.name || '?'} ${g.assist ? `(🏅 ${g.assist.name})` : ''}</span>
                    <button onclick="deleteGoal('${g.id}')" class="btn-danger" style="padding:2px 8px;font-size:11px;">✕</button>
                </div>
            `).join('')}
        `

    } catch (error) {
        console.error('Ошибка загрузки голов:', error)
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

window.addGoalToMatch = async function(matchId) {
    const playerId = document.getElementById('goalPlayer').value
    const assistId = document.getElementById('goalAssist').value

    if (!playerId) {
        alert('Выберите игрока, забившего гол')
        return
    }

    try {
        const { error } = await supabase
            .from('goals')
            .insert({
                match_id: matchId,
                player_id: playerId,
                assist_id: assistId || null
            })

        if (error) throw error

        alert('✅ Гол добавлен!')
        loadMatchGoals(matchId)
        
        // Очищаем поля
        document.getElementById('goalPlayer').value = ''
        document.getElementById('goalAssist').value = ''

    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

window.deleteGoal = async function(id) {
    if (!confirm('Удалить гол?')) return
    
    try {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)

        if (error) throw error

        alert('✅ Гол удален')
        // Перезагружаем список голов для текущего матча
        const matchId = window.currentMatchId || null
        if (matchId) loadMatchGoals(matchId)

    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

window.updateMatch = async function(e, id) {
    e.preventDefault()
    
    const score_a = parseInt(document.getElementById('editScoreA').value) || 0
    const score_b = parseInt(document.getElementById('editScoreB').value) || 0
    const status = document.getElementById('editMatchStatus').value

    try {
        const { error } = await supabase
            .from('matches')
            .update({ score_a, score_b, status })
            .eq('id', id)

        if (error) throw error

        closeModal()
        alert('✅ Матч обновлен!')
        // Обновляем список матчей
        if (currentTournamentId) {
            selectTournament(currentTournamentId)
        }

    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
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
    // Проверяем, есть ли команды в турнире
    const { data: teams, error: teamsError } = await supabase
        .from('tournament_teams')
        .select('id')
        .eq('tournament_id', tournamentId)

    if (teamsError) {
        alert('Ошибка проверки команд: ' + teamsError.message)
        return
    }

    if (!teams || teams.length < 3) {
        alert('❌ Сначала добавьте 3 команды в турнир!')
        return
    }

    if (!confirm('Создать расписание для этого турнира?')) return

    try {
        const { error } = await supabase
            .rpc('generate_tournament_schedule', { p_tournament_id: tournamentId })

        if (error) throw error

        alert('✅ Расписание создано (12 матчей)!')
        loadTournaments()
        if (currentTournamentId) {
            selectTournament(currentTournamentId)
        }
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
console.log('💡 Добавлены: редактирование игроков, турниров, матчей, голов')
