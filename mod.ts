
/** base cosense client class */
export class CosenseClient {
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
	static detectBrowser() {
		return Object.hasOwn(globalThis, "document");
	}
	constructor(
		options: CosenseClient,
	) {
		Object.assign(this, options);
	}
	async fetch(url: string, options?: RequestInit): Promise<Response> {
		const usesessid = !CosenseClient.detectBrowser() && this.sessionid;
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
export class Project  {
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
	client:CosenseClient;

	/** create a project reader */
	static async new(
		projectName: string,
		options: CosenseClient,
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
		return new Project(projectName,options,
			await projectInfomation.json(),
		);
	}

	private constructor(
		name:string,
		options: CosenseClient,
		projectInfo: Project,
	) {
		this.client = new CosenseClient(options);
		this.name = name;
		Object.assign(this, projectInfo);
	}

	/** asyncgenerator for all pages list */
	async *pageList(): AsyncGenerator<PageListItem, void, unknown> {
		let followId: string | null = null;
		while (true) {
			const partialPageListResponse: PageListItem[] =
				await (await this.client.fetch(
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
export class LatestPagesPage  {
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
	project: Project;
	/** internal use only */
	constructor(init: LatestPagesPage, project: Project) {
		Object.assign(this, init);
		this.project = project
	}

	getDetail(): Promise<Page> {
		return Page.new(this.title, this.project);
	}
}
export class LatestPages  {
	skip!: number; // parameterに渡したskipと同じ
	limit!: number; // parameterに渡したlimitと同じ
	count!: number; // projectの全ページ数 (中身のないページを除く)
	pages: LatestPagesPage[];
	project:Project;
	static async new(
		options: LatestPagesInit,
		project: Project,
	): Promise<LatestPages> {
		return new LatestPages(
			await (await project.client.fetch(
				"https://scrapbox.io/api/pages/" +
					project.name + "/?" +
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

export class SearchResult  {
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
	project:Project;
	static async new(
		query: string,
		project: Project,
	): Promise<SearchResult> {
		return new SearchResult(
			await (await project.client.fetch(
				"https://scrapbox.io/api/pages/" + project.name +
					"/search/query?q=" + encodeURIComponent(query),
			)).json(),
			project,
		);
	}
	private constructor(init: SearchResult, project: Project) {
		Object.assign(this, init);
		this.project = project;
	}
}

export class PageListItem  {
	id!: string;
	title!: string;
	links!: string[];
	updated!: number;
	project:Project;
	/** internal use only */
	constructor(init: PageListItem, project: Project) {
		Object.assign(this, init);
		this.project = project;
	}

	getDetail(): Promise<Page> {
		return Page.new(this.title, this.project);
	}
}

export class Page  {
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
	project:Project;
	static async new(
		pageName: string,
		project: Project,
	): Promise<Page> {
		return new Page(
			await (await project.client.fetch(
				`https://scrapbox.io/api/pages/${project.name}/${
					encodeURIComponent(pageName)
				}`,
			)).json(),
			project,
		);
	}
	private constructor(
		init: Page,
		project: Project,
	) {
		Object.assign(this, init);
		this.project = project;
	}
}
