import type { CosenseClientopts } from "./CosenseClientopts.ts";


/** Base class for the Cosense client */
export class CosenseClient implements CosenseClientopts {
	sessionid?: string;
	allowediting?: boolean;
	alternativeFetch?: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>;
	urlbase: string;

	/**
	 * Detects whether the runtime is a browser.
	 * @returns true if the environment is a browser, false otherwise.
	 */
	static detectBrowser(): boolean {
		return Object.hasOwn(globalThis, "document");
	}

	/**
	 * Constructs a new CosenseClient instance.
	 * @param options The client options.
	 */
	constructor(options: CosenseClientopts) {
		this.urlbase = "https://scrapbox.io/api/";
		Object.assign(this, options);
	}

	/**
	 * Fetches data from the server.
	 * @param url The URL to fetch.
	 * @param options The fetch options.
	 * @returns A Promise resolved with the fetch Response.
	 */
	async fetch(
		url: RequestInfo | URL,
		options?: RequestInit,
	): Promise<Response> {
		const usesessid = !CosenseClient.detectBrowser() && this.sessionid;
		return await (this.alternativeFetch ? this.alternativeFetch : fetch)(
			this.urlbase + url,
			usesessid
				? {
					headers: {
						"Cookie:": "connect-sid=" + this.sessionid,
					},
					...options,
				}
				: options,
		);
	}
}
