import babel from 'rollup-plugin-babel'

const license = `/*!
 * scroll-detector
 * https://github.com/yomotsu/scroll-detector
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */`

export default {
	entry: 'src/scroll-detector.js',
	indent: '\t',
	sourceMap: false,
	plugins: [
		babel( {
			exclude: 'node_modules/**',
			presets: [
				[ 'env', {
					targets: {
						browsers: [
							'last 2 versions',
							'ie >= 11'
						]
					},
					loose: true,
					modules: false
				} ]
			]
		} )
	],
	targets: [
		{
			format: 'umd',
			moduleName: 'scrollDetector',
			dest: 'dist/scroll-detector.js',
			banner: license
		},
		{
			format: 'es',
			dest: 'dist/scroll-detector.module.js',
			banner: license
		}
	]
};
