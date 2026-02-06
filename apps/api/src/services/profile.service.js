const prisma = require('../prisma');
const { createClient } = require('@supabase/supabase-js');

const hasSupabaseConfig = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
const supabase = hasSupabaseConfig
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    : null;

class ProfileService {
    async getProfile(userId) {
        const seeker = await prisma.jobSeeker.findUnique({
            where: { userId },
        });
        if (!seeker) throw new Error('Profile not found');

        const completion = this.calculateCompletion(seeker);
        return { ...seeker, completion };
    }

    calculateCompletion(seeker) {
        const fields = ['fullName', 'bio', 'location', 'skills', 'resumeUrl'];
        let filled = 0;
        fields.forEach(f => {
            if (seeker[f] && (Array.isArray(seeker[f]) ? seeker[f].length > 0 : true)) {
                filled++;
            }
        });
        return Math.round((filled / fields.length) * 100);
    }

    async updateProfile(userId, data) {
        return await prisma.jobSeeker.update({
            where: { userId },
            data,
        });
    }

    async uploadResume(userId, file) {
        if (!supabase) {
            throw new Error('Supabase is not configured');
        }
        const fileName = `resumes/${userId}-${Date.now()}.pdf`;
        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET || 'resumes')
            .upload(fileName, file.buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(process.env.SUPABASE_BUCKET || 'resumes')
            .getPublicUrl(fileName);

        return await this.updateProfile(userId, { resumeUrl: publicUrl });
    }
}

module.exports = new ProfileService();
