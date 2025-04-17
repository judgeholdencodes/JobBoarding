const client = require('../config/elasticsearch');

async function createJobIndex() {
  try {
    // Check if the 'jobs' index already exists
    const indexExists = await client.indices.exists({ index: 'jobs' });
    if (indexExists) {
      console.log('Index "jobs" already exists');
      return;
    }

    // Create the 'jobs' index with mappings
    await client.indices.create({
      index: 'jobs',
      body: {
        mappings: {
          properties: {
            title: { type: 'text' }, // Full-text search for job title
            description: { type: 'text' }, // Full-text search for description
            'company.name': { type: 'text' }, // Searchable company name
            'location.city': { type: 'keyword' }, // Exact match for city
            'location.country': { type: 'keyword' }, // Exact match for country
            jobType: { type: 'keyword' }, // Exact match for job type (e.g., full-time)
            experienceLevel: { type: 'keyword' }, // Exact match for experience level (e.g., mid)
            skills: { type: 'keyword' }, // Exact match for skills (e.g., JavaScript)
            postingDate: { type: 'date' }, // Sortable date field
            isActive: { type: 'boolean' } // Filter for active jobs
          }
        }
      }
    });
    console.log('Index "jobs" created successfully');
  } catch (err) {
    console.error('Error creating index:', err.message);
    if (err.meta) {
      console.error('Elasticsearch error details:', err.meta.body);
    }
  }
}

createJobIndex().then(() => process.exit(0)).catch(() => process.exit(1));