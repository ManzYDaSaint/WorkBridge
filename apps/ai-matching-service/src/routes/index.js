const { z } = require('zod');
const { callProfile } = require('../http');

const matchRequestSchema = z.object({
  job: z.object({
    id: z.string().optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    skills: z.array(z.string()).default([]),
    location: z.string().optional(),
    type: z.string().optional(),
    salaryRange: z.string().optional()
  }),
  options: z
    .object({
      limit: z.number().int().min(1).max(500).optional(),
      minScore: z.number().int().min(0).max(100).optional(),
      includeUnsubscribed: z.boolean().optional()
    })
    .optional()
});

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const calculateScore = (job, seeker) => {
  const jobSkills = (job.skills || []).map((s) => normalize(s)).filter(Boolean);
  const seekerSkills = (seeker.skills || []).map((s) => normalize(s)).filter(Boolean);
  const uniqueJobSkills = Array.from(new Set(jobSkills));
  const matches = uniqueJobSkills.filter((js) => seekerSkills.includes(js));
  const skillScore = uniqueJobSkills.length
    ? Math.round((matches.length / uniqueJobSkills.length) * 70)
    : 0;

  const jobLocation = normalize(job.location);
  const seekerLocation = normalize(seeker.location);
  const locationBonus = jobLocation && seekerLocation && seekerLocation.includes(jobLocation)
    ? Number(process.env.AI_LOCATION_BONUS || 15)
    : 0;

  const subscribed = Boolean(seeker.isSubscribed);
  const subscriptionBonus = subscribed ? Number(process.env.AI_SUBSCRIPTION_BONUS || 15) : 0;

  const total = Math.min(100, skillScore + locationBonus + subscriptionBonus);
  const reasons = [];
  if (uniqueJobSkills.length) reasons.push(`Skill match ${matches.length}/${uniqueJobSkills.length}`);
  if (locationBonus) reasons.push('Location match');
  if (subscriptionBonus) reasons.push('Subscribed');

  return { score: total, reasons, subscribed };
};

module.exports = async function (fastify) {
  fastify.post('/match/job', async (request, reply) => {
    const { job, options } = matchRequestSchema.parse(request.body || {});
    const limit = options?.limit ?? Number(process.env.AI_DEFAULT_LIMIT || 50);
    const minScore = options?.minScore ?? Number(process.env.AI_MIN_SCORE || 0);
    const includeUnsubscribed = options?.includeUnsubscribed ?? true;

    const seekers = (await callProfile('/internal/profiles/seekers')) || [];
    const candidates = seekers
      .map((seeker) => {
        const { score, reasons, subscribed } = calculateScore(job, seeker);
        return {
          seekerId: seeker.id,
          userId: seeker.userId,
          fullName: seeker.fullName,
          location: seeker.location,
          skills: seeker.skills || [],
          isSubscribed: seeker.isSubscribed,
          score,
          reasons
        };
      })
      .filter((c) => c.score >= minScore && (includeUnsubscribed || c.isSubscribed))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return reply.send({
      jobId: job.id || null,
      count: candidates.length,
      candidates
    });
  });

  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'ai-matching',
    timestamp: new Date().toISOString()
  }));
};
