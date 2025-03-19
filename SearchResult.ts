import type { Project } from "./Project.ts";
import { SearchResultPage } from "./SearchResultPage.ts";

/** Class representing a search result for a query */
export class SearchResult {
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
	static async new(
		query: string,
		project: Project,
	): Promise<SearchResult> {
		return new SearchResult(
			await (await project.client.fetch(
				"pages/" + project.name +
					"/search/query?q=" + encodeURIComponent(query),
			)).json(),
			project,
		);
	}

	private constructor(init: SearchResult, project: Project) {
		Object.assign(this, init);
		this.project = project;
		this.pages = init.pages.map((a) => new SearchResultPage(a, this));
	}
}
