const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const extractJson = (text = '') => {
    const trimmed = text.trim();

    try {
        return JSON.parse(trimmed);
    } catch (_error) {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(trimmed.slice(start, end + 1));
        }
        throw new Error('AI response is not valid JSON');
    }
};

const callOpenAIForJson = async ({ systemPrompt, userPrompt }) => {
    // OpenAI usage: this function calls the OpenAI Chat Completions API.
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            temperature: 0.35,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        }),
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${details}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || '{}';
    return extractJson(content);
};

const withFallback = async ({ systemPrompt, userPrompt, fallbackFactory }) => {
    if (!process.env.OPENAI_API_KEY) {
        return {
            mode: 'demo-fallback',
            data: fallbackFactory(),
            message: 'OPENAI_API_KEY not found. Demo generator used.',
        };
    }

    try {
        const aiData = await callOpenAIForJson({ systemPrompt, userPrompt });
        return { mode: 'ai', data: aiData, message: 'Generated using OpenAI.' };
    } catch (error) {
        return {
            mode: 'demo-fallback',
            data: fallbackFactory(),
            message: `OpenAI failed (${error.message}). Demo generator used.`,
        };
    }
};

const generateTimetableWithAI = async ({ facultyMembers, classrooms, fallbackFactory }) => {
    const systemPrompt =
        'You are a university operations AI. Return ONLY strict JSON with keys timetables and labs.';

    const userPrompt = `Create realistic weekly campus schedule data.
Return JSON shape:
{
  "timetables": [{
    "course": "string",
    "department": "string",
    "semester": 1,
    "facultyEmail": "string",
    "classroomName": "string",
    "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
    "timeSlot": "HH:MM-HH:MM",
    "labRequired": true
  }],
  "labs": [{
    "labName": "string",
    "department": "string",
    "subject": "string",
    "facultyEmail": "string",
    "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
    "timeSlot": "HH:MM-HH:MM",
    "batch": "Batch-A",
    "equipmentNeeds": ["string"]
  }]
}
Use 28-35 timetables and 8-14 labs.
Allowed faculty emails: ${facultyMembers.map((f) => f.email).join(', ')}
Allowed classroom names: ${classrooms.map((c) => c.name).join(', ')}
`;

    return withFallback({ systemPrompt, userPrompt, fallbackFactory });
};

const optimizeTransportWithAI = async ({ fallbackFactory }) => {
    const systemPrompt =
        'You are a transportation optimization AI for universities. Return ONLY strict JSON with key routes.';

    const userPrompt = `Generate optimized campus transport routes.
Return JSON shape:
{
  "routes": [{
    "routeName": "string",
    "busNumber": "Bus-1",
    "stops": ["Stop A", "Stop B"],
    "capacity": 50,
    "utilization": 72,
    "predictedDemand": 81,
    "status": "active|maintenance|inactive",
    "recommendation": "string"
  }]
}
Generate 5-7 routes with realistic utilization and recommendations.
`;

    return withFallback({ systemPrompt, userPrompt, fallbackFactory });
};

const predictMaintenanceWithAI = async ({ fallbackFactory }) => {
    const systemPrompt =
        'You are a predictive maintenance AI for smart campuses. Return ONLY strict JSON with key records.';

    const userPrompt = `Create realistic maintenance analysis.
Return JSON shape:
{
  "records": [{
    "facility": "string",
    "type": "string",
    "priority": "low|medium|high|critical",
    "status": "open|in-progress|resolved",
    "sensorScore": 78,
    "predictedFailureProbability": 0.64,
    "maintenanceAlert": "string",
    "notes": "string"
  }]
}
Generate 8-12 records.
`;

    return withFallback({ systemPrompt, userPrompt, fallbackFactory });
};

module.exports = {
    generateTimetableWithAI,
    optimizeTransportWithAI,
    predictMaintenanceWithAI,
};
