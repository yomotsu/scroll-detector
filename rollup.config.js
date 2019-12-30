import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const license = `/*!
 * ${ pkg.name }
 * https://github.com/${ pkg.repository }
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */`;

export default {
	input: 'src/scroll-detector.ts',
	output: [
		{
			format: 'umd',
			name: 'scrollDetector',
			file: pkg.main,
			banner: license,
			indent: '\t',
		},
		{
			format: 'es',
			file: pkg.module,
			banner: license,
			indent: '\t',
		}
	],
	plugins: [
		typescript( { typescript: require( 'typescript' ) } ),
	],
};
