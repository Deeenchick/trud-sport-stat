// js/services/tournamentService.js
// ================================================================
// СЕРВИС ДЛЯ РАБОТЫ С ТУРНИРАМИ
// ================================================================

import { supabase } from '../supabase.js'

export const tournamentService = {

    async getAll() {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('date', { ascending: false })
        if (error) throw error
        return data
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single()
        if (error) throw error
        return data
    },

    async getTeams(tournamentId) {
        const { data, error } = await supabase
            .from('tournament_teams')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('name')
        if (error) throw error
        return data
    },

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

    // ===== ИСПРАВЛЕНО: БЕЗ STATUS =====
    async getMatches(tournamentId) {
        const { data, error } = await supabase
            .from('matches')
            .select(`
                id,
                tournament_id,
                team_a_id,
                team_b_id,
                score_a,
                score_b,
                round,
                match_order,
                created_at,
                updated_at,
                team_a:team_a_id (id, name),
                team_b:team_b_id (id, name)
            `)
            .eq('tournament_id', tournamentId)
            .order('match_order')
        if (error) throw error
        return data
    },

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

    async getTable(tournamentId) {
        const { data, error } = await supabase
            .rpc('get_tournament_table', {
                p_tournament_id: tournamentId
            })
        if (error) throw error
        return data
    },

    async generateSchedule(tournamentId) {
        const { error } = await supabase
            .rpc('generate_tournament_schedule', {
                p_tournament_id: tournamentId
            })
        if (error) throw error
        return true
    },

    async create(data) {
        const { data: result, error } = await supabase
            .from('tournaments')
            .insert(data)
            .select()
            .single()
        if (error) throw error
        return result
    },

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

    async delete(id) {
        const { error } = await supabase
            .from('tournaments')
            .delete()
            .eq('id', id)
        if (error) throw error
        return true
    }
}
