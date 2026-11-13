const api = require('./api');

function load() {
  return api.request('/api/v1/progress');
}

function save(state, revision) {
  return api.request('/api/v1/progress', {
    method: 'PUT',
    data: {
      state,
      baseRevision: Number(revision) || 0,
      clientMutationId: `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
  });
}

module.exports = { load, save };
