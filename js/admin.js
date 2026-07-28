// js/admin.js
// ================================================================
// АДМИН-ПАНЕЛЬ (ПОЛНАЯ ВЕРСИЯ)
// ================================================================

import { supabase } from './supabase.js'

// ================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ================================================================

let currentTournamentId = null
let currentMatchData = null

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
        const { data, error } = await supabase.from('players').select('*').order('name')
        if (error) throw error
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">Нет игроков</div>'
            return
        }
        container.innerHTML = `
            <div class="table-wrap">
                <table class="stats-table">
                    <thead><tr><th>Имя</th><th style="text-align:center;">Действия</th></tr></thead>
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
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ЗАГРУЗКА ТУРНИРОВ
// ================================================================

async function loadTournaments() {
    const container = document.getElementById('tournamentsList')
    try {
        const { data, error } = await supabase.from('tournaments').select('*').order('date', { ascending: false })
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
                                    <button onclick="editTournament('${t.id}')" class="btn-warning" style="margin-right:4px;">✏️</button>
                                    <button onclick="manageTeams('${t.id}')" class="btn-primary" style="margin-right:4px;">👥 Составы</button>
                                    <button onclick="generateSchedule('${t.id}')" class="btn-success" style="margin-right:4px;">📅</button>
                                    <button onclick="deleteTournament('${t.id}')" class="btn-danger">🗑️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `
    } catch (error) {
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// ЗАГРУЗКА МАТЧЕЙ
// ================================================================

async function loadMatches() {
    const container = document.getElementById('matchesList')
    try {
        const { data: tournaments, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: false })
        if (error) throw error
        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = '<div class="empty">Нет турниров</div>'
            return
        }
        container.innerHTML = `
            <div style="margin-bottom:16px;">
                <select id="tournamentSelect" onchange="selectTournament(this.value)" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                    <option value="">— Выберите турнир —</option>
                    ${tournaments.map(t => `<option value="${t.id}">${t.name} (${t.date})</option>`).join('')}
                </select>
            </div>
            <div id="matchesContainer"><div class="empty">Выберите турнир</div></div>
        `
    } catch (error) {
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// УПРАВЛЕНИЕ СОСТАВАМИ КОМАНД
// ================================================================

window.manageTeams = async function(tournamentId) {
    // Получаем информацию о турнире
    const { data: tournament, error: tourError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single()
    
    if (tourError) {
        alert('Ошибка загрузки турнира: ' + tourError.message)
        return
    }

    // Получаем команды турнира
    let { data: teams, error: teamsError } = await supabase
        .from('tournament_teams')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name')

    if (teamsError) {
        alert('Ошибка загрузки команд: ' + teamsError.message)
        return
    }

    // Если команд нет — создаем (А, Б, В)
    if (!teams || teams.length === 0) {
        const teamNames = ['А', 'Б', 'В']
        for (const name of teamNames) {
            const { error: insertError } = await supabase
                .from('tournament_teams')
                .insert({ tournament_id: tournamentId, name })
            if (insertError) {
                alert('Ошибка создания команды ' + name + ': ' + insertError.message)
                return
            }
        }
        
        // Перезагружаем команды
        const { data: newTeams, error: reloadError } = await supabase
            .from('tournament_teams')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('name')
        
        if (reloadError) {
            alert('Ошибка перезагрузки команд: ' + reloadError.message)
            return
        }
        teams = newTeams
    }

    // Получаем всех игроков
    const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .order('name')

    if (playersError) {
        alert('Ошибка загрузки игроков: ' + playersError.message)
        return
    }

    // Получаем текущие составы
    const teamPlayers = {}
    for (const team of teams) {
        const { data, error } = await supabase
            .from('team_players')
            .select('player_id')
            .eq('team_id', team.id)
        
        if (!error) {
            teamPlayers[team.id] = data.map(tp => tp.player_id)
        } else {
            teamPlayers[team.id] = []
        }
    }

    // Строим модальное окно
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = `👥 Составы команд — ${tournament.name}`

    let html = `
        <div style="margin-bottom:16px;color:#7a8399;font-size:14px;">
            Выберите по 5 игроков для каждой команды
        </div>
        <form id="teamsForm">
    `

    for (const team of teams) {
        const teamColor = team.name === 'А' ? 'team-A' : team.name === 'Б' ? 'team-B' : 'team-C'
        html += `
            <div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px;">
                <div style="font-weight:700;color:#ffd700;margin-bottom:8px;">
                    <span class="team-badge ${teamColor}">Команда ${team.name}</span>
                    <span style="color:#7a8399;font-weight:400;font-size:13px;margin-left:8px;">
                        (выбрано: <span id="count-${team.id}">${teamPlayers[team.id]?.length || 0}</span>/5)
                    </span>
                </div>
                <div class="player-select-grid">
                    ${allPlayers.map(p => {
                        const checked = teamPlayers[team.id]?.includes(p.id) ? 'checked' : ''
                        return `
                            <div class="player-select-item">
                                <input type="checkbox" 
                                       name="team_${team.id}" 
                                       value="${p.id}" 
                                       ${checked}
                                       onchange="updateTeamCount('${team.id}')">
                                <label style="font-size:14px;cursor:pointer;">${p.name}</label>
                            </div>
                        `
                    }).join('')}
                </div>
            </div>
        `
    }

    html += `
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить составы
            </button>
        </form>
    `

    content.innerHTML = html
    modal.style.display = 'flex'

    // Сохраняем ID команд для использования в onchange
    window.currentTeamIds = teams.map(t => t.id)

    document.getElementById('teamsForm').onsubmit = async function(e) {
        e.preventDefault()
        
        // Собираем данные
        for (const team of teams) {
            const checkboxes = document.querySelectorAll(`input[name="team_${team.id}"]:checked`)
            const playerIds = Array.from(checkboxes).map(cb => cb.value)
            
            // Проверяем, что выбрано 5 игроков
            if (playerIds.length !== 5) {
                alert(`Для команды ${team.name} нужно выбрать ровно 5 игроков (сейчас ${playerIds.length})`)
                return
            }

            // Удаляем старые связи
            await supabase
                .from('team_players')
                .delete()
                .eq('team_id', team.id)

            // Добавляем новые
            for (const playerId of playerIds) {
                await supabase
                    .from('team_players')
                    .insert({ team_id: team.id, player_id: playerId })
            }
        }

        alert('✅ Составы команд сохранены!')
        closeModal()
        loadTournaments()
    }
}

// Обновление счетчика выбранных игроков
window.updateTeamCount = function(teamId) {
    const checkboxes = document.querySelectorAll(`input[name="team_${teamId}"]:checked`)
    const countEl = document.getElementById(`count-${teamId}`)
    if (countEl) {
        countEl.textContent = checkboxes.length
        // Меняем цвет, если не 5
        countEl.style.color = checkboxes.length === 5 ? '#5dca8a' : '#ffd700'
    }
}

// ================================================================
// СОЗДАНИЕ ТУРНИРА (ИСПРАВЛЕНО)
// ================================================================

window.showAddTournament = function() {
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '➕ Создать турнир'

    content.innerHTML = `
        <form id="addTournamentForm">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Название турнира</label>
                <input type="text" id="newTournamentName" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Дата</label>
                <input type="date" id="newTournamentDate" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Время</label>
                <input type="time" id="newTournamentTime" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Создать турнир
            </button>
        </form>
    `

    modal.style.display = 'flex'

    document.getElementById('addTournamentForm').onsubmit = async function(e) {
        e.preventDefault()
        
        const name = document.getElementById('newTournamentName').value.trim()
        const date = document.getElementById('newTournamentDate').value
        const time = document.getElementById('newTournamentTime').value

        if (!name || !date || !time) {
            alert('Заполните все поля')
            return
        }

        try {
            console.log('🔄 Создаем турнир:', { name, date, time })

            // 1. Создаем турнир
            const { data: tournament, error: tourError } = await supabase
                .from('tournaments')
                .insert({ name, date, time, status: 'scheduled' })
                .select()
                .single()

            if (tourError) {
                console.error('❌ Ошибка создания турнира:', tourError)
                alert('Ошибка: ' + tourError.message)
                return
            }

            console.log('✅ Турнир создан:', tournament)

            // 2. Создаем 3 команды (А, Б, В)
            const teamNames = ['А', 'Б', 'В']
            for (const teamName of teamNames) {
                const { error: teamError } = await supabase
                    .from('tournament_teams')
                    .insert({ tournament_id: tournament.id, name: teamName })
                
                if (teamError) {
                    console.error(`❌ Ошибка создания команды ${teamName}:`, teamError)
                } else {
                    console.log(`✅ Команда ${teamName} создана`)
                }
            }

            closeModal()
            await loadTournaments()
            alert(`✅ Турнир "${name}" создан! Команды А, Б, В добавлены автоматически. Теперь распределите игроков по командам (кнопка "Составы").`)
            
        } catch (error) {
            console.error('❌ Ошибка:', error)
            alert('❌ Ошибка: ' + error.message)
        }
    }
}

// ================================================================
// РЕДАКТИРОВАНИЕ ТУРНИРА
// ================================================================

window.editTournament = async function(id) {
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()
    if (error) {
        alert('Ошибка: ' + error.message)
        return
    }

    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '✏️ Редактировать турнир'

    content.innerHTML = `
        <form id="editTournamentForm">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Название</label>
                <input type="text" id="editName" value="${data.name}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Дата</label>
                <input type="date" id="editDate" value="${data.date}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Время</label>
                <input type="time" id="editTime" value="${data.time}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Статус</label>
                <select id="editStatus" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
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

    document.getElementById('editTournamentForm').onsubmit = async function(e) {
        e.preventDefault()
        
        const name = document.getElementById('editName').value.trim()
        const date = document.getElementById('editDate').value
        const time = document.getElementById('editTime').value
        const status = document.getElementById('editStatus').value

        try {
            const { error } = await supabase
                .from('tournaments')
                .update({ name, date, time, status })
                .eq('id', id)

            if (error) throw error

            closeModal()
            await loadTournaments()
            alert('✅ Турнир обновлен!')
        } catch (error) {
            alert('❌ Ошибка: ' + error.message)
        }
    }
}

// ================================================================
// ГЕНЕРАЦИЯ РАСПИСАНИЯ (С ПРОВЕРКОЙ)
// ================================================================

window.generateSchedule = async function(tournamentId) {
    // Проверяем, есть ли команды
    const { data: teams, error: teamsError } = await supabase
        .from('tournament_teams')
        .select('id')
        .eq('tournament_id', tournamentId)

    if (teamsError) {
        alert('Ошибка проверки команд: ' + teamsError.message)
        return
    }

    if (!teams || teams.length < 3) {
        alert('❌ Сначала добавьте команды и распределите игроков! (кнопка "Составы")')
        return
    }

    // Проверяем, есть ли игроки в командах
    let hasPlayers = false
    for (const team of teams) {
        const { data: players, error } = await supabase
            .from('team_players')
            .select('id')
            .eq('team_id', team.id)
            .limit(1)
        
        if (!error && players && players.length > 0) {
            hasPlayers = true
            break
        }
    }

    if (!hasPlayers) {
        alert('❌ В командах нет игроков! Сначала распределите игроков по командам (кнопка "Составы")')
        return
    }

    // Проверяем, есть ли уже матчи
    const { data: existingMatches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId)
        .limit(1)

    if (matchError) {
        alert('Ошибка проверки матчей: ' + matchError.message)
        return
    }

    if (existingMatches && existingMatches.length > 0) {
        if (!confirm('В этом турнире уже есть матчи. Создать заново? (старые матчи будут удалены)')) {
            return
        }
        
        // Удаляем старые матчи
        const { error: deleteError } = await supabase
            .from('matches')
            .delete()
            .eq('tournament_id', tournamentId)
        
        if (deleteError) {
            alert('Ошибка удаления старых матчей: ' + deleteError.message)
            return
        }
    }

    if (!confirm('Создать расписание (12 матчей) для этого турнира?')) return

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
// РЕДАКТИРОВАНИЕ ИГРОКА
// ================================================================

window.editPlayer = function(id, currentName) {
    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = '✏️ Редактировать игрока'

    content.innerHTML = `
        <form id="editPlayerForm">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Имя</label>
                <input type="text" id="editPlayerName" value="${currentName}" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить
            </button>
        </form>
    `

    modal.style.display = 'flex'

    document.getElementById('editPlayerForm').onsubmit = async function(e) {
        e.preventDefault()
        const name = document.getElementById('editPlayerName').value.trim()
        if (!name) { alert('Введите имя'); return }
        
        try {
            const { error } = await supabase
                .from('players')
                .update({ name })
                .eq('id', id)
            if (error) throw error
            closeModal()
            await loadPlayers()
            alert('✅ Игрок обновлен!')
        } catch (error) {
            alert('❌ Ошибка: ' + error.message)
        }
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
        <form id="addPlayerForm">
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Имя</label>
                <input type="text" id="newPlayerName" required style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить
            </button>
        </form>
    `
    modal.style.display = 'flex'

    document.getElementById('addPlayerForm').onsubmit = async function(e) {
        e.preventDefault()
        const name = document.getElementById('newPlayerName').value.trim()
        if (!name) { alert('Введите имя'); return }
        try {
            const { error } = await supabase.from('players').insert({ name })
            if (error) throw error
            closeModal()
            await loadPlayers()
            alert('✅ Игрок добавлен!')
        } catch (error) {
            alert('❌ Ошибка: ' + error.message)
        }
    }
}

// ================================================================
// УДАЛЕНИЕ
// ================================================================

window.deletePlayer = async function(id) {
    if (!confirm('Удалить игрока?')) return
    try {
        await supabase.from('players').delete().eq('id', id)
        await loadPlayers()
        alert('✅ Игрок удален')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

window.deleteTournament = async function(id) {
    if (!confirm('Удалить турнир?')) return
    try {
        await supabase.from('tournaments').delete().eq('id', id)
        await loadTournaments()
        alert('✅ Турнир удален')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// ВЫБОР ТУРНИРА ДЛЯ МАТЧЕЙ
// ================================================================

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
            .select(`*, team_a:team_a_id (id, name), team_b:team_b_id (id, name)`)
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
                    <thead><tr><th>#</th><th>Матч</th><th>Счет</th><th>Статус</th><th style="text-align:center;">Действия</th></tr></thead>
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
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// РЕДАКТИРОВАНИЕ МАТЧА
// ================================================================

window.editMatch = async function(id) {
    // Получаем данные матча
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
            *,
            team_a:team_a_id (id, name),
            team_b:team_b_id (id, name)
        `)
        .eq('id', id)
        .single()

    if (matchError) {
        alert('Ошибка загрузки данных: ' + matchError.message)
        return
    }

    // Получаем игроков команды А
    const { data: teamAPlayers, error: teamAError } = await supabase
        .from('team_players')
        .select(`player_id, players:player_id (id, name)`)
        .eq('team_id', match.team_a_id)

    if (teamAError) {
        alert('Ошибка загрузки игроков команды А: ' + teamAError.message)
        return
    }

    // Получаем игроков команды Б
    const { data: teamBPlayers, error: teamBError } = await supabase
        .from('team_players')
        .select(`player_id, players:player_id (id, name)`)
        .eq('team_id', match.team_b_id)

    if (teamBError) {
        alert('Ошибка загрузки игроков команды Б: ' + teamBError.message)
        return
    }

    // Собираем всех игроков матча
    const allPlayers = []
    teamAPlayers.forEach(tp => {
        if (tp.players) {
            allPlayers.push({
                id: tp.players.id,
                name: tp.players.name,
                team: 'A',
                teamName: match.team_a?.name || 'Команда А'
            })
        }
    })
    teamBPlayers.forEach(tp => {
        if (tp.players) {
            allPlayers.push({
                id: tp.players.id,
                name: tp.players.name,
                team: 'B',
                teamName: match.team_b?.name || 'Команда Б'
            })
        }
    })
    allPlayers.sort((a, b) => a.name.localeCompare(b.name))

    const playerOptions = allPlayers.map(p => 
        `<option value="${p.id}" data-team="${p.team}">${p.name} (${p.teamName})</option>`
    ).join('')

    const modal = document.getElementById('modal')
    const content = document.getElementById('modalContent')
    document.getElementById('modalTitle').textContent = `✏️ Редактировать матч: ${match.team_a?.name} vs ${match.team_b?.name}`

    content.innerHTML = `
        <form id="editMatchForm">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;text-align:center;padding:16px;background:rgba(255,215,0,0.05);border-radius:12px;">
                <div>
                    <div style="color:#7a8399;font-size:12px;">${match.team_a?.name || '?'}</div>
                    <div style="font-size:32px;font-weight:900;color:#ffd700;" id="displayScoreA">${match.score_a || 0}</div>
                </div>
                <div>
                    <div style="color:#7a8399;font-size:12px;">Счет</div>
                    <div style="font-size:24px;font-weight:700;color:#7a8399;">:</div>
                </div>
                <div>
                    <div style="color:#7a8399;font-size:12px;">${match.team_b?.name || '?'}</div>
                    <div style="font-size:32px;font-weight:900;color:#ffd700;" id="displayScoreB">${match.score_b || 0}</div>
                </div>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">Статус матча</label>
                <select id="editMatchStatus" style="width:100%;padding:10px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                    <option value="scheduled" ${match.status === 'scheduled' ? 'selected' : ''}>📅 Запланирован</option>
                    <option value="live" ${match.status === 'live' ? 'selected' : ''}>🟢 Идет</option>
                    <option value="finished" ${match.status === 'finished' ? 'selected' : ''}>✅ Завершен</option>
                </select>
            </div>

            <div style="margin-bottom:16px;padding:12px;background:rgba(255,215,0,0.05);border-radius:8px;">
                <label style="display:block;color:#7a8399;margin-bottom:6px;">⚽ Добавить гол</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <div>
                        <select id="goalPlayer" style="width:100%;padding:8px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;" onchange="updateAssistOptions()">
                            <option value="">— Кто забил —</option>
                            ${playerOptions}
                        </select>
                    </div>
                    <div>
                        <select id="goalAssist" style="width:100%;padding:8px;background:#141a24;border:1px solid #1e2530;border-radius:8px;color:#e8edf5;">
                            <option value="">— Ассистент —</option>
                        </select>
                    </div>
                </div>
                <button type="button" onclick="addGoalToMatch('${id}')" class="btn-success" style="padding:6px 16px;">➕ Добавить гол</button>
            </div>

            <div id="matchGoalsList" style="margin-bottom:16px;">
                <div style="color:#7a8399;font-size:13px;">Загрузка голов...</div>
            </div>

            <button type="submit" style="width:100%;padding:12px;background:#ffd700;color:#0b0e12;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
                Сохранить изменения
            </button>
        </form>
    `

    modal.style.display = 'flex'

    // Сохраняем данные
    currentMatchData = {
        matchId: id,
        allPlayers: allPlayers,
        teamAPlayers: teamAPlayers.map(tp => tp.player_id).filter(Boolean),
        teamBPlayers: teamBPlayers.map(tp => tp.player_id).filter(Boolean),
        match: match
    }

    loadMatchGoals(id)

    document.getElementById('editMatchForm').onsubmit = async function(e) {
        e.preventDefault()
        const status = document.getElementById('editMatchStatus').value
        try {
            const { error } = await supabase
                .from('matches')
                .update({ status })
                .eq('id', id)
            if (error) throw error
            closeModal()
            if (currentTournamentId) await selectTournament(currentTournamentId)
            alert('✅ Статус матча обновлен!')
        } catch (error) {
            alert('❌ Ошибка: ' + error.message)
        }
    }
}

// ================================================================
// ОБНОВЛЕНИЕ АССИСТЕНТОВ
// ================================================================

window.updateAssistOptions = function() {
    const playerSelect = document.getElementById('goalPlayer')
    const assistSelect = document.getElementById('goalAssist')
    const selectedPlayerId = playerSelect.value
    
    assistSelect.innerHTML = '<option value="">— Ассистент —</option>'
    if (!selectedPlayerId || !currentMatchData) return
    
    const player = currentMatchData.allPlayers.find(p => p.id === selectedPlayerId)
    if (!player) return
    
    const teamPlayers = player.team === 'A' 
        ? currentMatchData.teamAPlayers 
        : currentMatchData.teamBPlayers
    
    currentMatchData.allPlayers
        .filter(p => teamPlayers.includes(p.id) && p.id !== selectedPlayerId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(p => {
            const option = document.createElement('option')
            option.value = p.id
            option.textContent = p.name
            assistSelect.appendChild(option)
        })
}

// ================================================================
// ЗАГРУЗКА ГОЛОВ
// ================================================================

async function loadMatchGoals(matchId) {
    const container = document.getElementById('matchGoalsList')
    try {
        const { data, error } = await supabase
            .from('goals')
            .select(`id, player:player_id (id, name), assist:assist_id (id, name)`)
            .eq('match_id', matchId)
        if (error) throw error

        await updateMatchScore(matchId)

        if (!data || data.length === 0) {
            container.innerHTML = '<div style="color:#7a8399;font-size:13px;">⚽ Голов пока нет</div>'
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
        container.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`
    }
}

// ================================================================
// АВТООБНОВЛЕНИЕ СЧЕТА
// ================================================================

async function updateMatchScore(matchId) {
    try {
        const { data: goals, error } = await supabase
            .from('goals')
            .select(`id, player:player_id (id, name)`)
            .eq('match_id', matchId)
        if (error) throw error

        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select(`*, team_a:team_a_id (id, name), team_b:team_b_id (id, name)`)
            .eq('id', matchId)
            .single()
        if (matchError) throw matchError

        const { data: teamAPlayers } = await supabase
            .from('team_players')
            .select('player_id')
            .eq('team_id', match.team_a_id)
        const { data: teamBPlayers } = await supabase
            .from('team_players')
            .select('player_id')
            .eq('team_id', match.team_b_id)

        const teamAIds = teamAPlayers?.map(tp => tp.player_id) || []
        const teamBIds = teamBPlayers?.map(tp => tp.player_id) || []

        let scoreA = 0, scoreB = 0
        goals?.forEach(g => {
            if (teamAIds.includes(g.player_id)) scoreA++
            else if (teamBIds.includes(g.player_id)) scoreB++
        })

        await supabase.from('matches').update({ score_a: scoreA, score_b: scoreB }).eq('id', matchId)

        const displayA = document.getElementById('displayScoreA')
        const displayB = document.getElementById('displayScoreB')
        if (displayA) displayA.textContent = scoreA
        if (displayB) displayB.textContent = scoreB

    } catch (error) {
        console.error('Ошибка обновления счета:', error)
    }
}

// ================================================================
// ДОБАВЛЕНИЕ ГОЛА
// ================================================================

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
            .insert({ match_id: matchId, player_id: playerId, assist_id: assistId || null })
        if (error) throw error

        await loadMatchGoals(matchId)
        document.getElementById('goalPlayer').value = ''
        document.getElementById('goalAssist').innerHTML = '<option value="">— Ассистент —</option>'
        alert('✅ Гол добавлен! Счет обновлен автоматически')
    } catch (error) {
        alert('❌ Ошибка: ' + error.message)
    }
}

// ================================================================
// УДАЛЕНИЕ ГОЛА
// ================================================================

window.deleteGoal = async function(id) {
    if (!confirm('Удалить гол?')) return
    try {
        const { error } = await supabase.from('goals').delete().eq('id', id)
        if (error) throw error

        const matchId = currentMatchData?.matchId
        if (matchId) await loadMatchGoals(matchId)
        alert('✅ Гол удален! Счет обновлен автоматически')
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
