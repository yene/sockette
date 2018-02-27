function noop() {}

export default function (url, opts) {
	opts = opts || {};

	let k, ws, num, $={}, self=this;
	let ms=opts.timeout || 1e3, max=opts.maxAttempts || Infinity;

	$.onmessage = opts.onmessage || noop;

	$.onclose = e => {
		// 1005 is actually not an error. It's just a status code that signifies no status code was given.
		(e.code !== 1e3 && e.code !== 1005) && self.reconnect(e);
		(opts.onclose || noop)(e);
	};

	$.onerror = e => {
		// ECONNREFUSED typically means that the socket (on the server-end) doesn't exist or isn't a socket. 
		// This (can) typically happen when your server has started and the WebSocket is trying to reconnect before the server is healthy again.
		(e && e.code==='ECONNREFUSED') ? self.reconnect(e) : (opts.onerror || noop)(e);
	};

	$.onopen = e => {
		num=0; (opts.onopen || noop)(e);
	};

	self.open = () => {
		ws = new WebSocket(url, opts.protocols);
		for (k in $) ws[k] = $[k];
	};

	self.reconnect = e => {
		(num++ < max) ? setTimeout(_ => {
			(opts.onreconnect || noop)(e);
			self.open();
		}, ms) : (opts.onmaximum || noop)(e);
	};

	self.json = x => {
		ws.send(JSON.stringify(x));
	};

	self.send = x => {
		ws.send(x);
	};

	self.close = (x, y) => {
		ws.close(x, y);
	};

	self.open(); // init

	return self;
}
