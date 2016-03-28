var path = require('path');
var reactDocs = require('react-docgen');
var config = require('../src/utils/config');
var isArray = require('lodash/isArray');

var requirePlaceholder = '<%{#require#}%>';

module.exports = function (source) {
	this.cacheable && this.cacheable();

	var jsonProps;
	try {
		var props = reactDocs.parse(source, config.resolver, config.handlers);

		jsonProps = (isArray(props) ? props : [props]).map(function(doc) {
			if (doc.description) {
				doc.doclets = reactDocs.utils.docblock.getDoclets(doc.description);
				doc.description = doc.description.replace(/^@(\w+)(?:$|\s((?:[^](?!^@\w))*))/gmi, '');
			} else {
				doc.doclets = {};
			}

			if (doc.doclets.example) {
				doc.example = requirePlaceholder;
			}

			return JSON.stringify(doc).replace(
				'"' + requirePlaceholder + '"', 
				doc.doclets.example && 'require(' + JSON.stringify('examples!' + doc.doclets.example) + ')'
			);
		});
	}
	catch (e) {
		console.log('Error when parsing', path.basename(this.request));
		console.log(e.toString());
		console.log();
		jsonProps = [];
	}

	return [
		'if (module.hot) {',
		'	module.hot.accept([]);',
		'}',
		'module.exports = [' + jsonProps.join(',') + '];'
	].join('\n');
};
