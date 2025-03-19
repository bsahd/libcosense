import { Page } from "./Page.ts";

/** Represents a related page to a given page. This includes one-hop and two-hop related pages. */
export class RelatedPage {
	/** ID of the related page */
	id!: string;
	/** Title of the related page */
	title!: string;
	/** Lowercased title of the related page */
	titleLc!: string;
	/** URL of the related page's thumbnail */
	image!: string;
	/** Descriptions of the related page */
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
