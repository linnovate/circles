//define a standard, language-agnostic interface by swagger

module.exports = function(app) {

	swagger = require('swagger-node-express');

	swagger.setAppHandler(app);

	var model = require('./docs/models');
	swagger.addModels(model);

	var normalizedPath = require('path').join(__dirname, 'docs', 'services');
	require('fs').readdirSync(normalizedPath).forEach(function(file) {
		require('./docs/services/' + file).load(swagger);
	});

	swagger.configureSwaggerPaths('', 'api/swagger/docs', '');
	swagger.configure('/api/v1', '1.0.0');

	app.get('/api/docs', function(req, res, next) {
		res.render('index', {
			endpoint: '/api/swagger/docs'
		}, function(err, html) {
			if (err) return res.send(500, err);
			res.send(html);
		});
	});
};