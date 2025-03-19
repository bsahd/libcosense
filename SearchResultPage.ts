import { Page } from "./Page.ts";
import type { SearchResult } from "./SearchResult.ts";

/** Class representing a search result page */
export class SearchResultPage {
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

	/** Internal use only */
	constructor(
		init: SearchResultPage,
		project: SearchResult,
	) {
		Object.assign(this, init);
		this.search = project;
	}

	/** Fetches the detailed page information */
	getDetail(): Promise<Page> {
		return Page.new(this.title, this.search.project);
	}
}
