// deno-lint-ignore-file no-inner-declarations no-var


export interface CosenseConstructorOptions {
	/**
	 * This option only works in runtime other than a browser.
	 */
	sessionid: string | null;
	/**
	 * in runtime other than a browser, requires sessionid.
	 */
	allowediting: boolean;
}

export class CosenseClient {
	options: CosenseConstructorOptions;
	projectName:string;
	protected constructor(projectName:string,options: CosenseConstructorOptions) {
		this.options = options;
		this.projectName=projectName;
	}
	async fetch(url: string, options?: RequestInit): Promise<Response> {
		return await fetch(
			url,
			this.options.sessionid
				? {
					headers: {
						"Cookie:": "connect-sid=" + this.options.sessionid,
					},
					...options,
				}
				: options,
		);
	}
}
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
	
	static async new(
		projectName: string,
		options?: CosenseConstructorOptions,
	): Promise<Project> {
		var a = await fetch(
			"https://scrapbox.io/api/projects/" +
				encodeURIComponent(projectName),
			options?.sessionid
				? {
					headers: { "Cookie:": "connect-sid=" + options.sessionid },
				}
				: {},
		);
		if (!a.ok) {
			throw new Error(await a.text());
		}
		return new Project(
			projectName,
			options ? options : { allowediting: false, sessionid: null },
			await a.json(),
		);
	}
	
	private constructor(
		name: string,
		options: CosenseConstructorOptions,
		projectInfo: Project,
	) {
		super(name,options);
		this.name = name;
		Object.assign(this, projectInfo);
	}
	async *pageList(): AsyncGenerator<PageListItem, void, unknown> {
		var followId: string | null = null;
		while (true) {
			var res: PageListItem[] = await (await this.fetch(
				"https://scrapbox.io/api/pages/" +
					this.name + "/search/titles" +
					(followId ? "?followingId=" + followId : ""),
			)).json();
			console.log(res);
			if (res.length < 2) {
				return;
			}
			followId = res[res.length - 1].id;
			for (const e of res) {
				yield new PageListItem({
					...e,
					options: this.options,
					project: this.name,
				});
			}
		}
	}
	getPage(pageName:string){
		return Page.new(this.projectName,pageName,this)
	}
}

export class PageListItem extends CosenseClient {
	id!: string;
	title!: string;
	links!: string[];
	updated!: number;

	constructor(init: {
		id: string;
		title: string;
		links: string[];
		updated: number;
		options: CosenseConstructorOptions;
		project: string;
	}) {
		super(init.project,init.options);
		Object.assign(this, init); 
	}

	getDetail() {
		return Page.new(this.projectName,this.title,this)
	}
}

export class Page extends CosenseClient{
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
	static async new(projectName:string,pageName:string,options:CosenseClient){
		return new Page(
			await (await options.fetch(
				`https://scrapbox.io/api/pages/${projectName}/${
					encodeURIComponent(pageName)
				}`,
			)).json(),projectName,options
		);
	}
	private constructor(init: Page,projectName:string,options:CosenseClient) {
		super(projectName,options.options)
		Object.assign(this, init);
	}
}

var vp = await Project.new("villagepump");
for await (const element of vp.pageList()) {
	console.log(element);
}
console.log(await vp.getPage("井戸端"))
