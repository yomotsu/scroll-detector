export default function throttle( fn, threshhold ) {

	let last, deferTimer;

	return function () {

		const now = Date.now();

		if ( last && now < last + threshhold ) {

			clearTimeout( deferTimer );
			deferTimer = setTimeout( function () {

				last = now;
				fn();

			}, threshhold );

		} else {

			last = now;
			fn();

		}

	};

}
