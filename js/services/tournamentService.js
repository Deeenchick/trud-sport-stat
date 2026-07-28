// js/services/tournamentService.js
// ================================================================
// СЕРВИС ДЛЯ РАБОТЫ С ТУРНИРАМИ
// ================================================================

import { supabase } from '../supabase.js'

export const tournamentService = {

    // Получить все турниры
    async getAll() {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: false })

        if (error) throw error
        return data
    },

    // Получить турнир по ID
    async getById(id) {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Получить команды турнира
    async getTeams(tournamentId) {
        const { data, error } = await supabase
            .from('tournament_teams')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('name')

        if (error) throw error
        return data
    },

    // Получить состав команды
    async getTeamPlayers(teamId) {
        const { data, error } = await supabase
            .from('team_players')
            .select(`
                player_id,
                players:player_id (id, name)
            `)
            .eq('team_id', teamId)

        if (error) throw error
        return data
    },

    // Получить матчи турнира
    async getMatches(tournamentId) {
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
        return data
    },

    // Получить голы матча
    async getMatchGoals(matchId) {
        const { data, error } = await supabase
            .from('goals')
            .select(`
                *,
                player:player_id (id, name),
                assist:assist_id (id, name)
            `)
            .eq('match_id', matchId)

        if (error) throw error
        return data
    },

    // Получить турнирную таблицу
    async getTable(tournamentId) {
        const { data, error } = await supabase
            .rpc('get_tournament_table', {
                p_tournament_id: tournamentId
            })

        if (error) throw error
        return data
    },

    // Генерировать расписание (12 матчей)
    async generateSchedule(tournamentId) {
        const { error } = await supabase
            .rpc('generate_tournament_schedule', {
                p_tournament_id: tournamentId
            })

        if (error) throw error
        return true
    },

    // Создать турнир
    async create(data) {
        const { data: result, error } = await supabase
            .from('tournaments')
            .insert(data)
            .select()
            .single()

        if (error) throw error
        return result
    },

    // Обновить турнир
    async update(id, updates) {
        const { data, error } = await supabase
            .from('tournaments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Удалить турнир
    async delete(id) {
        const { error } = await supabase
            .from('tournaments')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // Получить все матчи турнира с результатами
    async getMatchesWithResults(tournamentId) {
        const matches = await this.getMatches(tournamentId)

        for (const match of matches) {
            const goals = await this.getMatchGoals(match.id)
            match.goals = goals
        }

        return matches
    }
}
