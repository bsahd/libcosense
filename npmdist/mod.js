/** Base class for the Cosense client */
class CosenseClient {
	sessionid;
	allowediting;
	alternativeFetch;
	urlbase;
	/**
	 * Detects whether the runtime is a browser.
	 * @returns true if the environment is a browser, false otherwise.
	 */
	static detectBrowser() {
		return Object.hasOwn(globalThis, "document");
	}
	/**
	 * Constructs a new CosenseClient instance.
	 * @param options The client options.
	 */
	constructor(options) {
		this.urlbase = "https://scrapbox.io/api/";
		Object.assign(this, options);
	}
	/**
	 * Fetches data from the server.
	 * @param url The URL to fetch.
	 * @param options The fetch options.
	 * @returns A Promise resolved with the fetch Response.
	 */
	async fetch(url, options) {
		const usesessid = !CosenseClient.detectBrowser() && this.sessionid;
		return await (this.alternativeFetch ? this.alternativeFetch : fetch)(
			this.urlbase + url,
			usesessid
				? {
						headers: {
							Cookie: "connect.sid=" + this.sessionid,
						},
						...options,
					}
				: options,
		);
	}
	/**
	 * new project use existing client
	 * @param projectName Project name
	 * @returns Project instance
	 */
	getProject(projectName) {
		return Project.useClient(projectName, this);
	}
}
/** Class representing a single page in the latest pages result */
class LatestPagesPage {
	/** ID of the page */
	id;
	/** Title of the page */
	title;
	/** URL to the page's thumbnail */
	image;
	/** Descriptions of the page (first 5 lines excluding the title line) */
	descriptions;
	/** Creator of the page */
	user;
	/** Pin status of the page (0 if not pinned) */
	pin;
	/** Number of views the page has received */
	views;
	/** Number of backlinks to the page */
	linked;
	/** Commit ID for the latest changes */
	commitId;
	/** Unix timestamp when the page was created */
	created;
	/** Unix timestamp when the page was last updated */
	updated;
	/** Unix timestamp when the page was last accessed */
	accessed;
	/** Unix timestamp when the page was last accessed by the current user (undefined if not logged in or not accessed) */
	lastAccessed;
	/** Unix timestamp of the last backup created for the page */
	snapshotCreated;
	/** Page rank for the page */
	pageRank;
	/** The project this page belongs to */
	project;
	/**
	 * Creates a new instance of LatestPagesPage.
	 * @param init The initial data for the page.
	 * @param project The project this page belongs to.
	 */
	constructor(init, project) {
		Object.assign(this, init);
		this.project = project;
	}
	/** Fetches the detailed page information */
	getDetail() {
		return Page.new(this.title, this.project);
	}
}
/** Class representing the latest pages result */
class LatestPages {
	/** Number of pages skipped in the request */
	skip;
	/** Limit of pages in the request */
	limit;
	/** Total number of pages in the project (excluding empty pages) */
	count;
	/** List of the latest pages */
	pages;
	/** The project this result is associated with */
	project;
	/**
	 * Creates a new instance of LatestPages.
	 * @param options Options for querying the latest pages.
	 * @param project The project this result is associated with.
	 * @returns A Promise that resolves to the latest pages result.
	 */
	static async new(options, project) {
		return new LatestPages(
			await (
				await project.client.fetch(
					"pages/" + project.name + "/?" + options.limit
						? "limit=" + options.limit + "&"
						: "" + options.skip
							? "skip=" + options.skip + "&"
							: "" + options.sort
								? "sort=" + options.sort + "&"
								: "",
				)
			).json(),
			project,
		);
	}
	constructor(init, project) {
		Object.assign(this, init);
		this.project = project;
		this.pages = init.pages.map((a) => {
			return new LatestPagesPage(a, this.project);
		});
	}
}
/** Represents a full page with its detailed content, metadata, and associated properties */
class Page {
	/** ID of the page */
	id;
	/** Title of the page */
	title;
	/** URL of the page's thumbnail image */
	image;
	/** Descriptions of the page (excluding themod title) */
	descriptions;
	/** Information about the user who created the page */
	user;
	/** Information about the user who last updated the page */
	lastUpdateUser;
	/** Pin status of the page. If unpinned, it is 0 */
	pin;
	/** Number of views for the page */
	views;
	/** Number of backlinks for the page */
	linked;
	/** The commit ID for the latest update to the page */
	commitId;
	/** Unix timestamp of when the page was created */
	created;
	/** Unix timestamp of when the page was last updated */
	updated;
	/** Unix timestamp of when the page was last accessed */
	accessed;
	/** Unix timestamp of the last time the page was accessed by the current user (if applicable) */
	lastAccessed;
	/** Unix timestamp of when the last backup was created for the page */
	snapshotCreated;
	/** Page rank value */
	pageRank;
	/** The number of snapshots(Page History) created for this page */
	snapshotCount;
	/** Always true for pages */
	persistent;
	/** Array of lines in the page, where each line includes metadata like ID and text */
	lines;
	/** List of forward links in the page */
	links;
	/** List of icons included in the page */
	icons;
	/** List of file URLs referenced in the page */
	files;
	/** Information about related pages (one-hop and two-hop links) */
	relatedPages;
	/** List of collaborators on the page, excluding the creator and last updater */
	collaborators;
	/** The project this page belongs to */
	project;
	/**
	 * Retrieves a new instance of the Page class.
	 * @param pageName The title of the page to fetch
	 * @param project The project to which the page belongs
	 * @returns A promise that resolves to a new Page instance
	 */
	static async new(pageName, project) {
		return new Page(
			await (
				await project.client.fetch(
					`pages/${project.name}/${encodeURIComponent(pageName)}`,
				)
			).json(),
			project,
		);
	}
	/**
	 * Internal constructor used by the `new` method to create a page instance.
	 * @param init The initial data for the page
	 * @param project The project to which the page belongs
	 */
	constructor(init, project) {
		Object.assign(this, init);
		this.project = project;
		this.relatedPages.links1hop = init.relatedPages.links1hop.map(
			(relatedItem) => new RelatedPage(relatedItem, this),
		);
		this.relatedPages.links2hop = init.relatedPages.links2hop.map(
			(relatedItem) => new RelatedPage(relatedItem, this),
		);
	}
	/** easyer access to text
	 * @returns Text of Page
	 */
	get text() {
		return this.lines.map((a) => a.text).join("\n");
	}
}
/** Represents a page list item, typically used for paginated page listing in a project */
class PageListItem {
	/** ID of the page */
	id;
	/** Title of the page */
	title;
	/** Links found within the page */
	links;
	/** Unix timestamp of the last update of the page */
	updated;
	/** The associated project for this page list item */
	project;
	/**
	 * Create a new instance of a PageListItem.
	 * @param init An object containing initial properties for the PageListItem
	 * @param project The project this page list item belongs to
	 */
	constructor(init, project) {
		Object.assign(this, init);
		this.project = project;
	}
	/**
	 * Retrieves the details of the page associated with this list item.
	 * @returns A promise resolving to a Page instance containing the full details
	 */
	getDetail() {
		return Page.new(this.title, this.project);
	}
}
/** Class representing a Cosense project */
class Project {
	/** Project UUID */
	id;
	/**
	 * Project URL (e.g., if the project URL is "https://scrapbox.io/example001", this is "example001").
	 */
	name;
	/** Project display name */
	displayName;
	/** Whether the project is publicly visible */
	publicVisible;
	/** Login strategies used for the project */
	loginStrategies;
	/** Theme of the project */
	theme;
	/** If the project uses Gyazo Teams, this is the Gyazo Teams name. Otherwise, it is null. */
	gyazoTeamsName;
	/** Project favicon */
	image;
	/** Whether translation is enabled */
	translation;
	/** Whether infobox is enabled */
	infobox;
	/** Unix timestamp when the project was created */
	created;
	/** Unix timestamp when the project was last updated */
	updated;
	/**
	 * Whether the current user is a member of the project.
	 * This is true if the user is logged in and a member of the project.
	 */
	isMember;
	/**
	 * If the project is private, indicates the type: "personal" or "business".
	 * If public, this is null.
	 * If not loggined, is undefined.
	 */
	plan;
	/** The CosenseClient instance used by this project */
	client;
	/** Users of project. If not loggined, is undefined. */
	users;
	/** ID of admins of project. If not loggined, is undefined. */
	admins;
	/** ID of owner of project. If not loggined, is undefined. */
	owner;
	/** If not loggined, is undefined. */
	trialing;
	/** If not loggined, is undefined. */
	trialMaxPages;
	/** If not loggined, is undefined. */
	skipPayment;
	/** always "gcs". If not loggined, is undefined. */
	uploadFileTo;
	/** gyazo or gcs. If not loggined, is undefined. */
	uploadImageTo;
	/** If not loggined, is undefined. */
	emailAddressPatterns;
	/** last backuped date. If not loggined, is undefined. */
	backuped;
	/** use existing CosenseClient
	 * 	@param projectName The name of the project (e.g., "example001" if the URL is "https://scrapbox.io/example001").
	 * @param client CosenseClient instance
	 * @returns A Promise that resolves to a Project instance.
	 */
	static async useClient(projectName, client) {
		const projectInformation = await client.fetch(
			"projects/" + encodeURIComponent(projectName),
		);
		if (!projectInformation.ok) {
			throw new Error(await projectInformation.text());
		}
		const pjjson = await projectInformation.json();
		return new Project(projectName, client, pjjson);
	}
	constructor(name, client, projectInfo) {
		this.client = client;
		this.name = name;
		Object.assign(this, projectInfo);
	}
	/**
	 * Fetches the list of all pages in the project.
	 * @returns An async generator yielding each page in the project.
	 */
	async *pageList() {
		let followId = null;
		while (true) {
			const partialPageListResponse = await (
				await this.client.fetch(
					"pages/" +
						this.name +
						"/search/titles" +
						(followId ? "?followingId=" + followId : ""),
				)
			).json();
			if (!Array.isArray(partialPageListResponse)) {
				throw "/search/titles is not array";
			}
			if (partialPageListResponse.length < 2) {
				return;
			}
			const lastItem = partialPageListResponse.at(-1);
			if (!lastItem) {
				throw "";
			}
			followId = lastItem.id;
			for (const e of partialPageListResponse) {
				yield new PageListItem(e, this);
			}
		}
	}
	/**
	 * Fetches the latest pages based on the specified options.
	 * @param options Options for querying the latest pages.
	 * @returns A Promise resolving to the latest pages result.
	 */
	latestPages(options) {
		return LatestPages.new(options, this);
	}
	/**
	 * Fetches a single page by name.
	 * @param pageName The name of the page.
	 * @returns A Promise that resolves to the Page instance.
	 */
	getPage(pageName) {
		return Page.new(pageName, this);
	}
	/** Performs a full-text search across the project
	 * @param query a search query
	 * @returns promise resolve to search result
	 */
	search(query) {
		return SearchResult.new(query, this);
	}
}
/** Represents a related page to a given page. This includes one-hop and two-hop related pages. */
class RelatedPage {
	/** ID of the related page */
	id;
	/** Title of the related page */
	title;
	/** Lowercased title of the related page */
	titleLc;
	/** URL of the related page's thumbnail */
	image;
	/** Descriptions of the related page. max 5 lines. */
	descriptions;
	/** Lowercased list of links in the related page */
	linksLc;
	/** Number of times this page is linked to */
	linked;
	/** Unix timestamp of the last update of the related page */
	updated;
	/** Unix timestamp of the last accessed time of the related page */
	accessed;
	/** The page this related page belongs to */
	page;
	/**
	 * Creates a new RelatedPage instance.
	 * @param relatedItem The initial properties for the related page
	 * @param page The page that this related page is linked to
	 */
	constructor(relatedItem, page) {
		Object.assign(this, relatedItem);
		this.page = page;
	}
	/**
	 * Retrieves the full details of this related page.
	 * @returns A promise resolving to the full Page instance of the related page
	 */
	getDetail() {
		return Page.new(this.title, this.page.project);
	}
}
/** Class representing a search result for a query */
class SearchResult {
	/** The search query */
	searchQuery;
	/** The parsed query */
	query;
	/** Limit of the search result */
	limit;
	/** Number of hits for the search */
	count;
	/** Whether an exact title match was found */
	existsExactTitleMatch;
	/** The backend used for the search (always "elasticsearch") */
	backend;
	/** Pages that match the search query */
	pages;
	/** The project the search result is from */
	project;
	/**
	 * Starts a new search query.
	 * @param query The search query.
	 * @param project The project to search within.
	 * @returns A Promise that resolves to the search result.
	 */
	static async new(query, project) {
		return new SearchResult(
			await (
				await project.client.fetch(
					"pages/" +
						project.name +
						"/search/query?q=" +
						encodeURIComponent(query),
				)
			).json(),
			project,
		);
	}
	constructor(init, project) {
		Object.assign(this, init);
		this.project = project;
		this.pages = init.pages.map((a) => new SearchResultPage(a, this));
	}
}
/** Class representing a search result page */
class SearchResultPage {
	/** Page ID */
	id;
	/** Title of the page */
	title;
	/** URL to the page's thumbnail */
	image;
	/** Keywords in the page */
	words;
	/** Hit lines in the page */
	lines;
	/** The search result this page belongs to */
	search;
	/** Constructor for SearchResultPage using in SearchResult
	 * @see SearchResult
	 */
	constructor(init, project) {
		Object.assign(this, init);
		this.search = project;
	}
	/** Fetches the detailed page information */
	getDetail() {
		return Page.new(this.title, this.search.project);
	}
}
export { CosenseClient };
