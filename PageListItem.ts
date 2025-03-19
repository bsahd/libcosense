import { Page } from "./Page.ts";
import type { Project } from "./Project.ts";


/** Represents a page list item, typically used for paginated page listing in a project */
export class PageListItem {
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


