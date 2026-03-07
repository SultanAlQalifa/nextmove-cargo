import { supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

export interface TesterMission {
    id: string;
    title: string;
    description: string;
    link: string;
    points_reward: number;
    completed?: boolean;
}

export interface TesterFeedback {
    id: string;
    content: string;
    type: string;
    status: string;
    admin_response?: string;
    created_at: string;
}

export const testerService = {
    /**
     * Fetch all active missions for the current user, marking completed ones.
     */
    async getMissions(): Promise<TesterMission[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: missions, error: mError } = await supabase
            .from('tester_missions')
            .select('*')
            .eq('is_active', true);

        if (mError) throw mError;

        const { data: completions, error: cError } = await supabase
            .from('tester_activity')
            .select('mission_id')
            .eq('user_id', user.id);

        if (cError) throw cError;

        const completedIds = new Set(completions.map(c => c.mission_id));

        return missions.map(m => ({
            ...m,
            completed: completedIds.has(m.id)
        }));
    },

    /**
     * Mark a mission as completed and award points.
     */
    async completeMission(missionId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non authentifié");

        // 1. Get mission points
        const { data: mission } = await supabase
            .from('tester_missions')
            .select('points_reward, title')
            .eq('id', missionId)
            .single();

        if (!mission) throw new Error("Mission introuvable");

        // 2. Log activity
        const { error: actError } = await supabase
            .from('tester_activity')
            .insert({ user_id: user.id, mission_id: missionId });

        if (actError) {
            if (actError.code === '23505') return; // Already completed
            throw actError;
        }

        // 3. Award points via RPC (existing system)
        await supabase.rpc('log_point_transaction', {
            p_user_id: user.id,
            p_amount: mission.points_reward,
            p_reason: 'tester_mission_complete',
            p_related_id: missionId,
            p_metadata: { mission_title: mission.title }
        });

        // 4. Update loyalty_points in profile directly if RPC doesn't do it
        await supabase.rpc('reward_tester_points', {
            target_user_id: user.id,
            points_to_add: mission.points_reward
        });

        logger.info(`[Tester] Mission ${missionId} completed by ${user.id}. Points awarded: ${mission.points_reward}`);
    },

    /**
     * Submit feedback/bug report.
     */
    async submitFeedback(content: string, type: string = 'feedback'): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non authentifié");

        const { error } = await supabase.from('tester_feedback').insert({
            user_id: user.id,
            content,
            type
        });

        if (error) throw error;
    },

    /**
     * Fetch user's feedback history.
     */
    async getMyFeedback(): Promise<TesterFeedback[]> {
        const { data, error } = await supabase
            .from('tester_feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
