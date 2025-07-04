/** Base class for the Cosense client */

class CosenseClient implements CosenseClientopts {
	sessionid?: string;
	allowediting?: boolean;
	alternativeFetch?: (request: Request) => Promise<Response> | Response;
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
	fetch(
		url: string | URL,
		options?: RequestInit,
	): Promise<Response> | Response {
		const usesessid = !CosenseClient.detectBrowser() && this.sessionid;
		const req = new Request(this.urlbase + url, options);
		if (usesessid) {
			req.headers.set("Cookie", "connect.sid=" + this.sessionid);
		}
		return (this.alternativeFetch ? this.alternativeFetch : fetch)(req);
	}

	/**
	 * new project use existing client
	 * @param projectName Project name
	 * @returns Project instance
	 */
	getProject(projectName: string): Promise<Project> {
		return Project.useClient(projectName, this);
	}
	toJSON() {
		return { ...this, sessionid: undefined };
	}
}
/** Options for the Cosense client */
interface CosenseClientopts {
	/**
	 * This option only works in runtimes other than a browser(e.g. Node.js, Deno, Bun, Cloudflare Workers).
	 * For security and flexibility reasons, it is STRONGLY recommended to obtain from environment variables.
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
	alternativeFetch?: (request: Request) => Promise<Response> | Response;

	/** Base URL for the API */
	urlbase?: string;
}

/** Options for querying the latest pages */
interface LatestPagesInit {
	/**
	 * Limit of elements to retrieve (min: 1, max: 1000).
	 */
	limit?: number;

	/**
	 * Number of elements to skip (useful for pagination).
	 */
	skip?: number;

	/**
	 * Sort method for the results. Can be one of:
	 * - "updated"
	 * - "created"
	 * - "accessed"
	 * - "linked"
	 * - "views"
	 * - "title"
	 * - "updatedbyMe"
	 */
	sort?:
		| "updated"
		| "created"
		| "accessed"
		| "linked"
		| "views"
		| "title"
		| "updatedbyMe";
}

/** Class representing a single page in the latest pages result */
class LatestPagesPage {
	/** ID of the page */
	id!: string;

	/** Title of the page */
	title!: string;

	/** URL to the page's thumbnail */
	image!: string | null;

	/** Descriptions of the page (first 5 lines excluding the title line) */
	descriptions!: string[];

	/** Creator of the page */
	user!: Collaborator;

	/** Pin status of the page (0 if not pinned) */
	pin!: number;

	/** Number of views the page has received */
	views!: number;

	/** Number of backlinks to the page */
	linked!: number;

	/** Commit ID for the latest changes */
	commitId!: string;

	/** Unix timestamp when the page was created */
	created!: number;

	/** Unix timestamp when the page was last updated */
	updated!: number;

	/** Unix timestamp when the page was last accessed */
	accessed!: number;

	/** Unix timestamp when the page was last accessed by the current user (undefined if not logged in or not accessed) */
	lastAccessed?: number;

	/** Unix timestamp of the last backup created for the page */
	snapshotCreated!: number | null;

	/** Page rank for the page */
	pageRank!: number;

	/** The project this page belongs to */
	project: Project;

	/**
	 * Creates a new instance of LatestPagesPage.
	 * @param init The initial data for the page.
	 * @param project The project this page belongs to.
	 */
	constructor(init: LatestPagesPage, project: Project) {
		Object.assign(this, init);
		this.project = project;
	}

	/** Fetches the detailed page information */
	getDetail(): Promise<Page> {
		return Page.new(this.title, this.project);
	}
}

/** Class representing the latest pages result */
class LatestPages {
	/** Number of pages skipped in the request */
	skip!: number;

	/** Limit of pages in the request */
	limit!: number;

	/** Total number of pages in the project (excluding empty pages) */
	count!: number;

	/** List of the latest pages */
	pages: LatestPagesPage[];

	/** The project this result is associated with */
	project: Project;

	/**
	 * Creates a new instance of LatestPages.
	 * @param options Options for querying the latest pages.
	 * @param project The project this result is associated with.
	 * @returns A Promise that resolves to the latest pages result.
	 */
	static async new(
		options: LatestPagesInit = {},
		project: Project,
	): Promise<LatestPages> {
		return new LatestPages(
			await (
				await project.client.fetch(
					"pages/" +
						project.name +
						"/?" +
						("limit" in options ? "limit=" + options.limit + "&" : "") +
						("skip" in options ? "skip=" + options.skip + "&" : "") +
						("sort" in options ? "sort=" + options.sort + "&" : ""),
				)
			).json(),
			project,
		);
	}

	private constructor(init: LatestPages, project: Project) {
		Object.assign(this, init);
		this.project = project;
		this.pages = init.pages.map((a) => {
			return new LatestPagesPage(a, this.project);
		});
	}
}

/** line of page.
 * @see Page
 */
interface PageLine {
	/** UUID of the line */
	id: string;
	/** Text of the line.
	 * text is written in Cosense markup language. use scrapbox-parser to parse line text.
	 * @see https://jsr.io/@progfay/scrapbox-parser */
	text: string;
	/** User ID of the person who created the line */
	userId: string;
	/** Unix timestamp of when the line was created */
	created: number;
	/** Unix timestamp of when the line was last updated */
	updated: number;
}

/** Collaborator, User, LastUpdateUser of Page. */
interface Collaborator {
	/** User ID of the collaborator */
	id: string;
	/** Page name of the collaborator */
	name: string;
	/** Display name of the collaborator */
	displayName: string;
	/** URL to the collaborator's photo */
	photo: string;
}

/** Information about related pages (one-hop and two-hop links) */
interface RelatedPages {
	/** Direct related pages (1-hop links) */
	links1hop: RelatedPage[];
	/** Indirect related pages (2-hop links) */
	links2hop: RelatedPage[];
	/** Whether the page has backlinks or icons linking to it */
	hasBackLinksOrIcons: boolean;
}

/** Represents a full page with its detailed content, metadata, and associated properties */
class Page {
	/** ID of the page */
	id!: string;
	/** Title of the page */
	title!: string;
	/** URL of the page's thumbnail image */
	image!: string | null;
	/** Descriptions of the page (excluding themod title) */
	descriptions!: string[];
	/** Information about the user who created the page */
	user!: Collaborator;
	/** Information about the user who last updated the page */
	lastUpdateUser!: Collaborator;
	/** Pin status of the page. If unpinned, it is 0 */
	pin!: number;
	/** Number of views for the page */
	views!: number;
	/** Number of backlinks for the page */
	linked!: number;
	/** The commit ID for the latest update to the page */
	commitId!: string;
	/** Unix timestamp of when the page was created */
	created!: number;
	/** Unix timestamp of when the page was last updated */
	updated!: number;
	/** Unix timestamp of when the page was last accessed */
	accessed!: number;
	/** Unix timestamp of the last time the page was accessed by the current user (if applicable) */
	lastAccessed?: number;
	/** Unix timestamp of when the last backup was created for the page */
	snapshotCreated!: number | null;
	/** Page rank value */
	pageRank!: number;
	/** The number of snapshots(Page History) created for this page */
	snapshotCount!: number;
	/** Always true for pages */
	persistent!: boolean;
	/** Array of lines in the page, where each line includes metadata like ID and text */
	lines!: PageLine[];
	/** List of forward links in the page */
	links!: string[];
	/** List of icons included in the page */
	icons!: string[];
	/** List of file URLs referenced in the page */
	files!: string[];
	/** Information about related pages (one-hop and two-hop links) */
	relatedPages!: RelatedPages;
	/** List of collaborators on the page, excluding the creator and last updater */
	collaborators!: Collaborator[];
	/** The project this page belongs to */
	project: Project;

	/**
	 * Retrieves a new instance of the Page class.
	 * @param pageName The title of the page to fetch
	 * @param project The project to which the page belongs
	 * @returns A promise that resolves to a new Page instance
	 */
	static async new(pageName: string, project: Project): Promise<Page> {
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
	private constructor(init: Page, project: Project) {
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
	get text(): string {
		return this.lines.map((a) => a.text).join("\n");
	}
}

/** Represents a page list item, typically used for paginated page listing in a project */
class PageListItem {
	/** ID of the page */
	id!: string;
	/** Title of the page */
	title!: string;
	/** Links found within the page */
	links!: string[];
	/** Unix timestamp of the last update of the page */
	updated!: number;
	/** The associated project for this page list item */
	project: Project;

	/**
	 * Create a new instance of a PageListItem.
	 * @param init An object containing initial properties for the PageListItem
	 * @param project The project this page list item belongs to
	 */
	constructor(init: PageListItem, project: Project) {
		Object.assign(this, init);
		this.project = project;
	}

	/**
	 * Retrieves the details of the page associated with this list item.
	 * @returns A promise resolving to a Page instance containing the full details
	 */
	getDetail(): Promise<Page> {
		return Page.new(this.title, this.project);
	}
}

/** member of project.
 * @see Project
 * @see Collaborator
 */
interface Member {
	/** UUID of user. */
	id: string;
	/** name of user. */
	name: string;
	/** display name of user. */
	displayName: string;
	/** Profile image used when there is no personal page.  */
	photo: string;
	/** E-mail address */
	email: string;
	/** unknown */
	pro: boolean;
	/** authnication provider */
	provider: "google" | "microsoft" | "email";
	/** unknown */
	created: number;
	/** unknown */
	updated: number;
	/** page fiters */
	pageFilters: { type: string; value: string }[];
}

/** Class representing a Cosense project */
class Project {
	/** Project UUID */
	id!: string;

	/**
	 * Project URL (e.g., if the project URL is "https://scrapbox.io/example001", this is "example001").
	 */
	name: string;

	/** Project display name */
	displayName!: string;

	/** Whether the project is publicly visible */
	publicVisible!: boolean;

	/** Login strategies used for the project */
	loginStrategies!: string[];

	/** Theme of the project */
	theme!: string;

	/** If the project uses Gyazo Teams, this is the Gyazo Teams name. Otherwise, it is null. */
	gyazoTeamsName!: string | null;

	/** Project favicon */
	image!: string | null;

	/** Whether translation is enabled */
	translation!: boolean;

	/** Whether infobox is enabled */
	infobox!: boolean;

	/** Unix timestamp when the project was created */
	created!: number;

	/** Unix timestamp when the project was last updated */
	updated!: number;

	/**
	 * Whether the current user is a member of the project.
	 * This is true if the user is logged in and a member of the project.
	 */
	isMember!: boolean;

	/**
	 * If the project is private, indicates the type: "personal" or "business".
	 * If public, this is null.
	 * If not loggined, is undefined.
	 */
	plan?: string | null;

	/** The CosenseClient instance used by this project */
	client: CosenseClient;

	/** Users of project. If not loggined, is undefined. */
	users?: Member[];

	/** ID of admins of project. If not loggined, is undefined. */
	admins?: string[];

	/** ID of owner of project. If not loggined, is undefined. */
	owner?: string;

	/** If not loggined, is undefined. */
	trialing?: boolean;

	/** If not loggined, is undefined. */
	trialMaxPages?: number;

	/** If not loggined, is undefined. */
	skipPayment?: boolean;

	/** always "gcs". If not loggined, is undefined. */
	uploadFileTo?: "gcs";

	/** gyazo or gcs. If not loggined, is undefined. */
	uploadImageTo?: "gyazo" | "gcs";

	/** If not loggined, is undefined. */
	emailAddressPatterns?: string[];

	/** last backuped date. If not loggined, is undefined. */
	backuped?: number | null;

	/** use existing CosenseClient
	 * 	@param projectName The name of the project (e.g., "example001" if the URL is "https://scrapbox.io/example001").
	 * @param client CosenseClient instance
	 * @returns A Promise that resolves to a Project instance.
	 */
	static async useClient(
		projectName: string,
		client: CosenseClient,
	): Promise<Project> {
		const projectInformation = await client.fetch(
			"projects/" + encodeURIComponent(projectName),
		);
		if (!projectInformation.ok) {
			throw new Error(await projectInformation.text());
		}
		const pjjson = await projectInformation.json();
		return new Project(projectName, client, pjjson);
	}

	private constructor(
		name: string,
		client: CosenseClient,
		projectInfo: Project,
	) {
		this.client = client;
		this.name = name;
		Object.assign(this, projectInfo);
	}

	/**
	 * Fetches the list of all pages in the project.
	 * @returns An async generator yielding each page in the project.
	 */
	async *pageList(): AsyncGenerator<PageListItem, void, unknown> {
		let followId: string | null = null;
		while (true) {
			const partialPageListResponse: PageListItem[] = await (
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
	latestPages(options: LatestPagesInit): Promise<LatestPages> {
		return LatestPages.new(options, this);
	}

	/**
	 * Fetches a single page by name.
	 * @param pageName The name of the page.
	 * @returns A Promise that resolves to the Page instance.
	 */
	getPage(pageName: string): Promise<Page> {
		return Page.new(pageName, this);
	}

	/** Performs a full-text search across the project
	 * @param query a search query
	 * @returns promise resolve to search result
	 */
	search(query: string): Promise<SearchResult> {
		return SearchResult.new(query, this);
	}
}

/** Represents a related page to a given page. This includes one-hop and two-hop related pages. */
class RelatedPage {
	/** ID of the related page */
	id!: string;
	/** Title of the related page */
	title!: string;
	/** Lowercased title of the related page */
	titleLc!: string;
	/** URL of the related page's thumbnail */
	image!: string;
	/** Descriptions of the related page. max 5 lines. */
	descriptions!: string[];
	/** Lowercased list of links in the related page */
	linksLc!: string[];
	/** Number of times this page is linked to */
	linked!: number;
	/** Unix timestamp of the last update of the related page */
	updated!: number;
	/** Unix timestamp of the last accessed time of the related page */
	accessed!: number;
	/** The page this related page belongs to */
	page: Page;

	/**
	 * Creates a new RelatedPage instance.
	 * @param relatedItem The initial properties for the related page
	 * @param page The page that this related page is linked to
	 */
	constructor(relatedItem: RelatedPage, page: Page) {
		Object.assign(this, relatedItem);
		this.page = page;
	}

	/**
	 * Retrieves the full details of this related page.
	 * @returns A promise resolving to the full Page instance of the related page
	 */
	getDetail(): Promise<Page> {
		return Page.new(this.title, this.page.project);
	}
}

/** Class representing a search result for a query */
class SearchResult {
	/** The search query */
	searchQuery!: string;

	/** The parsed query */
	query!: {
		words: string[];
		excludes: string[];
	};

	/** Limit of the search result */
	limit!: number;

	/** Number of hits for the search */
	count!: number;

	/** Whether an exact title match was found */
	existsExactTitleMatch!: boolean;

	/** The backend used for the search (always "elasticsearch") */
	backend!: "elasticsearch";

	/** Pages that match the search query */
	pages: SearchResultPage[];

	/** The project the search result is from */
	project: Project;

	/**
	 * Starts a new search query.
	 * @param query The search query.
	 * @param project The project to search within.
	 * @returns A Promise that resolves to the search result.
	 */
	static async new(query: string, project: Project): Promise<SearchResult> {
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

	private constructor(init: SearchResult, project: Project) {
		Object.assign(this, init);
		this.project = project;
		this.pages = init.pages.map((a) => new SearchResultPage(a, this));
	}
}

/** Class representing a search result page */
class SearchResultPage {
	/** Page ID */
	id!: string;

	/** Title of the page */
	title!: string;

	/** URL to the page's thumbnail */
	image!: string;

	/** Keywords in the page */
	words!: string[];

	/** Hit lines in the page */
	lines!: string[];

	/** The search result this page belongs to */
	search: SearchResult;

	/** Constructor for SearchResultPage using in SearchResult
	 * @see SearchResult
	 */
	constructor(init: SearchResultPage, project: SearchResult) {
		Object.assign(this, init);
		this.search = project;
	}

	/** Fetches the detailed page information */
	getDetail(): Promise<Page> {
		return Page.new(this.title, this.search.project);
	}
}

export { CosenseClient };
export type {
	Collaborator,
	CosenseClientopts,
	LatestPages,
	LatestPagesInit,
	LatestPagesPage,
	Member,
	Page,
	PageLine,
	PageListItem,
	RelatedPage,
	RelatedPages,
	SearchResult,
	SearchResultPage,
	Project,
};
