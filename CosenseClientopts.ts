/** Options for the Cosense client */
export interface CosenseClientopts {
	/**
	 * This option only works in runtimes other than a browser.
	 */
	sessionid?: string;

	/**
	 * In runtime environments other than a browser, requires sessionid.
	 * If undefined, it means false.
	 */
	allowediting?: boolean;

	/**
	 * If defined, use alternativeFetch instead of the default fetch.
	 */
	alternativeFetch?: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>;

	/** Base URL for the API */
	urlbase?: string;
}