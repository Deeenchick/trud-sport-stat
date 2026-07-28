// js/services/playerService.js
// ================================================================
// СЕРВИС ДЛЯ РАБОТЫ С ИГРОКАМИ
// ================================================================

import { supabase } from '../supabase.js'

export const playerService = {

    // Получить всех игроков
    async getAll() {
        const { data, error } = await supabase
            .from('players')
            .select('id, name')
            .order('name')

        if (error) throw error
        return data
    },

    // Получить игрока по ID
    async getById(id) {
        const { data, error } = await supabase
            .from('players')
            .select('id, name')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Получить полную статистику игрока
    async getStats(playerId) {
        const { data, error } = await supabase
            .rpc('get_player_full_stats', { p_player_id: playerId })

        if (error) throw error
        return data?.[0] || {}
    },

    // Получить PEI игрока за конкретный турнир
    async getPlayerPEI(playerId, tournamentId) {
        const { data, error } = await supabase
            .rpc('calculate_player_pei', {
                p_player_id: playerId,
                p_tournament_id: tournamentId
            })

        if (error) throw error
        return data
    },

    // Добавить игрока
    async create(name) {
        const { data, error } = await supabase
            .from('players')
            .insert({ name })
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Обновить игрока
    async update(id, updates) {
        const { data, error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Удалить игрока
    async delete(id) {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // Получить всех игроков со статистикой
    async getAllWithStats() {
        const players = await this.getAll()
        const result = []

        for (const player of players) {
            const stats = await this.getStats(player.id)
            result.push({ ...player, ...stats })
        }

        return result
    }
}
