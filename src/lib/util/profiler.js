const { performance } = require('perf_hooks');

const labels = {};

module.exports = {
	start(label) {
		// eslint-disable-next-line no-console
		if (label in labels) console.warn('Profiler: starting label which was already started!');
		labels[label] = performance.now();
	},

	end(label) {
		const result = performance.now() - labels[label];
		delete labels[label];
		setImmediate(() =>
			// eslint-disable-next-line no-console
			console.debug('[PROFILING]', label, result),
		);
	},
};
