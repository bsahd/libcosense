export interface CosenseConstructorOptions {
	/** Project name on cosense */
	projectName: string;
	/**
	 * This option only works in runtime other than a browser.
	 */
	sessionid?: string;
	/**
	 * in runtime other than a browser, requires sessionid.
	 * if is undefined, is means false.
	 */
	allowediting?: boolean;
	/**
	 * if not undefined, use alternativeFetch instead of fetch
	 */
	alternativeFetch?: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>;
}

class BrowserDetector {
	static detect() {
		return Object.hasOwn(globalThis, "document");
	}
}
/** base cosense client class */
export class CosenseClient implements CosenseConstructorOptions {
	projectName!: string;
	sessionid?: string;
	allowediting!: boolean;
	alternativeFetch?: (
		input: RequestInfo | URL,
		init?: RequestInit,
	) => Promise<Response>;

	protected constructor(
		options: CosenseConstructorOptions,
	) {
		Object.assign(this, options);
	}
	async fetch(url: string, options?: RequestInit): Promise<Response> {
		const usesessid = !BrowserDetector.detect() && this.sessionid;
		return await (this.alternativeFetch ? this.alternativeFetch : fetch)(
			url,
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

/** cosense project */
export class Project extends CosenseClient {
	id!: string;
	name: string;
	displayName!: string;
	publicVisible!: boolean;
	loginStrategies!: string[];
	plan!: string;
	theme!: string;
	gyazoTeamsName!: string | null;
	image?: string;
	translation!: boolean;
	infobox!: boolean;
	created!: number;
	updated!: number;
	isMember!: boolean;

	/** create a project reader */
	static async new(
		projectName: string,
		options: {
			/**
			 * This option only works in runtime other than a browser.
			 */
			sessionid?: string;
			/**
			 * in runtime other than a browser, requires sessionid.
			 * if is undefined, is means false.
			 */
			allowediting?: boolean;
			/**
			 * if not undefined, use alternativeFetch instead of fetch
			 */
			alternativeFetch?: (
				input: RequestInfo | URL,
				init?: RequestInit,
			) => Promise<Response>;
		},
	): Promise<Project> {
		const projectInfomation = await fetch(
			"https://scrapbox.io/api/projects/" +
				encodeURIComponent(projectName),
			options?.sessionid
				? {
					headers: { "Cookie:": "connect-sid=" + options.sessionid },
				}
				: {},
		);
		if (!projectInfomation.ok) {
			throw new Error(await projectInfomation.text());
		}
		return new Project(
			{ ...options, projectName },
			await projectInfomation.json(),
		);
	}

	private constructor(
		options: CosenseConstructorOptions,
		projectInfo: Project,
	) {
		super(options);
		this.name = options.projectName;
		Object.assign(this, projectInfo);
	}

	/** asyncgenerator for all pages list */
	async *pageList(): AsyncGenerator<PageListItem, void, unknown> {
		let followId: string | null = null;
		while (true) {
			const partialPageListResponse: PageListItem[] =
				await (await this.fetch(
					"https://scrapbox.io/api/pages/" +
						this.name + "/search/titles" +
						(followId ? "?followingId=" + followId : ""),
				)).json();
			if (partialPageListResponse.length < 2) {
				return;
			}
			followId =
				partialPageListResponse[partialPageListResponse.length - 1].id;
			for (const e of partialPageListResponse) {
				yield new PageListItem(e, this);
			}
		}
	}

	latestPages(options: LatestPagesInit):Promise<LatestPages> {
		return LatestPages.new(options, this);
	}

	/** get single page */
	getPage(pageName: string): Promise<Page> {
		return Page.new(pageName, this);
	}

	search(query: string): Promise<SearchResult> {
		return SearchResult.new(query, this);
	}
}
export interface LatestPagesInit {
	limit?: number;
	skip?: number;
	sort:
		| "updated"
		| "created"
		| "accessed"
		| "linked"
		| "views"
		| "title"
		| "updatedbyMe";
}
export class LatestPagesPage extends CosenseClient {
	id!: string;
	title!: string;
	image!: string | null;
	descriptions!: string[];
	user!: { id: string };
	pin!: number; // pinされてないときは0
	views!: number;
	linked!: number;
	commitId!: string;
	created!: number;
	updated!: number;
	accessed!: number;
	lastAccessed?: number;
	snapshotCreated!: number | null;
	pageRank!: number;
	/** internal use only */
	constructor(init: LatestPagesPage, super2: CosenseClient) {
		super(super2);
		Object.assign(this, init);
	}

	getDetail(): Promise<Page> {
		return Page.new(this.title, this);
	}
}
export class LatestPages extends CosenseClient {
	skip!: number; // parameterに渡したskipと同じ
	limit!: number; // parameterに渡したlimitと同じ
	count!: number; // projectの全ページ数 (中身のないページを除く)
	pages: LatestPagesPage[];
	static async new(
		options: LatestPagesInit,
		super2: CosenseClient,
	): Promise<LatestPages> {
		return new LatestPages(
			await (await super2.fetch(
				"https://scrapbox.io/api/pages/" +
					super2.projectName + "/?" +
					options.limit
					? "limit=" + options.limit + "&"
					: "" +
							options.skip
					? "skip=" + options.skip + "&"
					: "" +
							options.sort
					? "sort=" + options.sort + "&"
					: "",
			)).json(),
			super2,
		);
	}
	private constructor(init: LatestPages, super2: CosenseClient) {
		super(super2);
		Object.assign(this, init);
		this.pages = init.pages.map((a) => {
			return new LatestPagesPage(a, this);
		});
	}
}

export class SearchResult extends CosenseClient {
	searchQuery!: string; // 検索語句
	query!: {
		words: string[]; // AND検索に使った語句
		excludes: string[];
	};
	limit!: number; // 検索件数の上限
	count!: number; // 検索件数
	existsExactTitleMatch!: boolean; // 詳細不明
	backend!: "elasticsearch";
	pages!: {
		id: string;
		title: string;
		image: string; // 無いときは''になる
		words: string[];
		lines: string[];
	}[];
	static async new(
		query: string,
		super2: CosenseClient,
	): Promise<SearchResult> {
		return new SearchResult(
			await (await super2.fetch(
				"https://scrapbox.io/api/pages/" + super2.projectName +
					"/search/query?q=" + encodeURIComponent(query),
			)).json(),
			super2,
		);
	}
	private constructor(init: SearchResult, super2: CosenseClient) {
		super(super2);
		Object.assign(this, init);
	}
}

export class PageListItem extends CosenseClient {
	id!: string;
	title!: string;
	links!: string[];
	updated!: number;
	/** internal use only */
	constructor(init: PageListItem, super2: CosenseClient) {
		super(super2);
		Object.assign(this, init);
	}

	getDetail(): Promise<Page> {
		return Page.new(this.title, this);
	}
}

export class Page extends CosenseClient {
	id!: string;
	title!: string;
	image!: string;
	descriptions!: string[];
	pin!: 0 | 1;
	views!: number;
	linked!: number;
	commitId?: string;
	created!: number;
	updated!: number;
	accessed!: number;
	lastAccessed!: number | null;
	snapshotCreated!: number | null;
	snapshotCount!: number;
	pageRank!: number;
	persistent!: boolean;
	lines!: {
		id: string;
		text: string;
		userId: string;
		created: number;
		updated: number;
	}[];
	links!: string[];
	icons!: string[];
	files!: string[];
	relatedPages!: {
		links1hop: {
			id: string;
			title: string;
			titleLc: string;
			image: string;
			descriptions: string[];
			linksLc: string[];
			linked: number;
			updated: number;
			accessed: number;
		}[];
		links2hop: {
			id: string;
			title: string;
			titleLc: string;
			image: string;
			descriptions: string[];
			linksLc: string[];
			linked: number;
			updated: number;
			accessed: number;
		}[];
		hasBackLinksOrIcons: boolean;
	};
	user!: {
		id: string;
		name: string;
		displayName: string;
		photo: string;
	};
	collaborators!: {
		id: string;
		name: string;
		displayName: string;
		photo: string;
	}[];
	static async new(
		pageName: string,
		options: CosenseClient,
	): Promise<Page> {
		return new Page(
			await (await options.fetch(
				`https://scrapbox.io/api/pages/${options.projectName}/${
					encodeURIComponent(pageName)
				}`,
			)).json(),
			options,
		);
	}
	private constructor(
		init: Page,
		options: CosenseClient,
	) {
		super(options);
		Object.assign(this, init);
	}
}
