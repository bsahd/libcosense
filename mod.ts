// deno-lint-ignore-file no-inner-declarations

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
	constructor(options: CosenseConstructorOptions) {
		this.options = options;
	}
	async fetch(url: string, options?: RequestInit) {
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
	id: string;
	name: string;
	displayName: string;
	publicVisible: boolean;
	loginStrategies: string[];
	plan: string;
	theme: string;
	gyazoTeamsName: string | null;
	image?: string;
	translation: boolean;
	infobox: boolean;
	created: number;
	updated: number;
	isMember: boolean;
	constructor(
		name: string,
		options: CosenseConstructorOptions,
		projectInfo: Project,
	) {
		super(options);
		this.name = name;
		this.id = projectInfo.id;
		this.name = projectInfo.name;
		this.displayName = projectInfo.displayName;
		this.publicVisible = projectInfo.publicVisible;
		this.loginStrategies = projectInfo.loginStrategies;
		this.plan = projectInfo.plan;
		this.theme = projectInfo.theme;
		this.gyazoTeamsName = projectInfo.gyazoTeamsName;
		this.image = projectInfo.image;
		this.translation = projectInfo.translation;
		this.infobox = projectInfo.infobox;
		this.created = projectInfo.created;
		this.updated = projectInfo.updated;
		this.isMember = projectInfo.isMember;
	}
	async *pageList() {
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
				yield new PageListItem(
					e.id,
					e.title,
					e.links,
					e.updated,
					this.options,
					this.name,
				);
			}
		}
	}
}

class PageListItem extends CosenseClient {
	id: string;
	title: string;
	links: string[];
	updated: number;
	project: string;
	constructor(
		id: string,
		title: string,
		links: string[],
		updated: number,
		options: CosenseConstructorOptions,
		project: string,
	) {
		super(options);
		this.id = id;
		this.title = title;
		this.links = links;
		this.updated = updated;
		this.project = project;
	}
	async getDetail() {
		return await (await this.fetch(
			"https://scrapbox.io/api/pages/" +
				this.project + "/" + encodeURIComponent(this.title),
		)).json();
	}
}

export async function cosenseFactory(
	projectName: string,
	options?: CosenseConstructorOptions,
) {
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
var vp = await cosenseFactory("villagepump");
for await (const element of vp.pageList()) {
	console.log(element);
}
