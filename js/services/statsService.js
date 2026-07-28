// js/services/statsService.js
// ================================================================
// СЕРВИС ДЛЯ РАСЧЕТА СТАТИСТИКИ
// ================================================================

import { supabase } from '../supabase.js'
import { playerService } from './playerService.js'
import { tournamentService } from './tournamentService.js'

export const statsService = {

    // Получить всех игроков со статистикой
    async getAllPlayersStats() {
        const players = await playerService.getAll()
        const result = []

        for (const player of players) {
            const stats = await playerService.getStats(player.id)
            result.push({ ...player, ...stats })
        }

        return result
    },

    // Топ-10 бомбардиров
    async getTopScorers(limit = 10) {
        const players = await this.getAllPlayersStats()
        return players
            .sort((a, b) => (b.total_goals || 0) - (a.total_goals || 0))
            .slice(0, limit)
    },

    // Топ-10 ассистентов
    async getTopAssists(limit = 10) {
        const players = await this.getAllPlayersStats()
        return players
            .sort((a, b) => (b.total_assists || 0) - (a.total_assists || 0))
            .slice(0, limit)
    },

    // Топ-10 по PEI
    async getTopRating(limit = 10) {
        const players = await this.getAllPlayersStats()
        return players
            .sort((a, b) => (b.current_rating || 0) - (a.current_rating || 0))
            .slice(0, limit)
    },

    // Топ-10 универсалов (голы + пасы)
    async getTopUniversal(limit = 10) {
        const players = await this.getAllPlayersStats()
        return players
            .sort((a, b) => ((b.total_goals || 0) + (b.total_assists || 0)) - ((a.total_goals || 0) + (a.total_assists ||
                0)))
            .slice(0, limit)
    },

    // Топ-10 по ИМП
    async getTopIMP(limit = 10) {
        const players = await this.getAllPlayersStats()
        return players
            .sort((a, b) => {
                const impA = a.total_matches > 0 ? (a.total_goals + a.total_assists) / (a.total_matches * 0.5 + 1) : 0
                const impB = b.total_matches > 0 ? (b.total_goals + b.total_assists) / (b.total_matches * 0.5 + 1) : 0
                return impB - impA
            })
            .slice(0, limit)
    },

    // Получить героев последних турниров
    async getLastHeroes(limit = 3) {
        const tournaments = await tournamentService.getAll()
        const completed = tournaments.filter(t => t.status === 'finished')
        const lastThree = completed.slice(0, limit)

        const heroes = []
        for (const tournament of lastThree) {
            const table = await tournamentService.getTable(tournament.id)
            const winner = table?.find(row => row.place === 1)

            // Получаем лучшего бомбардира турнира (упрощенно)
            const matches = await tournamentService.getMatches(tournament.id)
            const allGoals = []
            for (const match of matches) {
                const goals = await tournamentService.getMatchGoals(match.id)
                for (const goal of goals) {
                    if (goal.player_id) {
                        const player = await playerService.getById(goal.player_id)
                        allGoals.push(player?.name || '')
                    }
                }
            }

            // Подсчет голов
            const goalCount = {}
            allGoals.forEach(name => {
                goalCount[name] = (goalCount[name] || 0) + 1
            })
            const topScorer = Object.entries(goalCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 1)
                .map(([name, count]) => `${name} (${count})`)[0] || '—'

            heroes.push({
                tournament: tournament.date,
                winner: winner?.team_name || '—',
                topScorer: topScorer,
                mvp: winner?.team_name || '—'
            })
        }

        return heroes
    },

    // Получить зал славы
    async getHallOfFame() {
        const topScorers = await this.getTopScorers(1)
        const topAssists = await this.getTopAssists(1)
        const topRating = await this.getTopRating(1)
        const topIMP = await this.getTopIMP(1)

        return [
            { icon: '🥇', name: topScorers[0]?.name || '—', desc: 'Лучший бомбардир', value: `${topScorers[0]?.total_goals || 0} голов` },
            { icon: '🧠', name: topAssists[0]?.name || '—', desc: 'Лучший ассистент', value: `${topAssists[0]?.total_assists || 0} пасов` },
            { icon: '👑', name: topRating[0]?.name || '—', desc: 'Лучший PEI', value: `${(topRating[0]?.current_rating || 0).toFixed(2)}` },
            { icon: '⚡', name: topIMP[0]?.name || '—', desc: 'Лучший ИМП', value: `${(topIMP[0]?.total_goals + topIMP[0]?.total_assists || 0) / (topIMP[0]?.total_matches * 0.5 + 1 || 1)}`.slice(0, 5) }
        ]
    }
}
