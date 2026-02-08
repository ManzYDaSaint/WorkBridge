const prisma = require('../prisma');
const { createClient } = require('@supabase/supabase-js');

const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
const supabase = hasSupabase ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY) : null;

class ProfileService {
  calculateCompletion(seeker) {
    const fields = ['fullName', 'bio', 'location', 'skills', 'resumeUrl'];
    let filled = 0;
    fields.forEach((f) => {
      if (seeker[f] && (Array.isArray(seeker[f]) ? seeker[f].length > 0 : true)) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }

  async getProfile(userId) {
    const seeker = await prisma.jobSeeker.findUnique({ where: { userId } });
    if (!seeker) throw new Error('Profile not found');
    const completion = this.calculateCompletion(seeker);
    return { ...seeker, completion };
  }

  async updateProfile(userId, data) {
    return prisma.jobSeeker.update({ where: { userId }, data });
  }

  async uploadResume(userId, file) {
    if (!supabase) throw new Error('Supabase is not configured');
    const fileName = `resumes/${userId}-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'resumes')
      .upload(fileName, file.buffer, { contentType: 'application/pdf', upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'resumes')
      .getPublicUrl(fileName);
    return this.updateProfile(userId, { resumeUrl: publicUrl });
  }

  async createProfileFromAuth({ userId, role, fullName, companyName, industry, location }) {
    if (role === 'JOB_SEEKER') {
      const s = await prisma.jobSeeker.create({
        data: { userId, fullName: fullName || 'User', location }
      });
      return { jobSeeker: s };
    }
    if (role === 'EMPLOYER') {
      const e = await prisma.employer.create({
        data: { userId, companyName: companyName || 'Company', industry, location, status: 'PENDING' }
      });
      return { employer: e };
    }
    return {};
  }

  async getByUserId(userId) {
    const seeker = await prisma.jobSeeker.findUnique({ where: { userId } });
    if (seeker) return { jobSeeker: seeker };
    const employer = await prisma.employer.findUnique({ where: { userId } });
    if (employer) return { employer };
    return {};
  }

  async getEmployerById(employerId) {
    return prisma.employer.findUnique({ where: { id: employerId } });
  }

  async getSeekerById(seekerId) {
    return prisma.jobSeeker.findUnique({ where: { id: seekerId } });
  }

  async getAllEmployers() {
    return prisma.employer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateEmployerStatus(employerId, status) {
    return prisma.employer.update({ where: { id: employerId }, data: { status } });
  }

  async getAllSeekers() {
    return prisma.jobSeeker.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getStats() {
    const [totalEmployers, totalJobSeekers] = await Promise.all([
      prisma.employer.count(),
      prisma.jobSeeker.count()
    ]);
    return { totalEmployers, totalJobSeekers };
  }

  async toggleSubscription(userId) {
    const seeker = await prisma.jobSeeker.findUnique({ where: { userId } });
    if (!seeker) throw new Error('Job seeker not found');
    const updated = await prisma.jobSeeker.update({
      where: { userId },
      data: { isSubscribed: !seeker.isSubscribed }
    });
    return { isSubscribed: updated.isSubscribed };
  }
}

module.exports = new ProfileService();
