import { RelatedPage } from "./RelatedPage.ts";
import type { Project } from "./Project.ts";

/** Represents a full page with its detailed content, metadata, and associated properties */
export class Page {
	/** ID of the page */
	id!: string;
	/** Title of the page */
	title!: string;
	/** URL of the page's thumbnail image */
	image!: string | null;
	/** Descriptions of the page (excluding themod title) */
	descriptions!: string[];
	/** Information about the user who created the page */
	user!: {
		/** User ID */
		id: string;
		/** User's page name */
		name: string;
		/** User's display name */
		displayName: string;
		/** URL to the user's photo */
		photo: string;
	};
	/** Information about the user who last updated the page */
	lastUpdateUser!: {
		/** User ID */
		id: string;
		/** User's page name */
		name: string;
		/** User's display name */
		displayName: string;
		/** URL to the user's photo */
		photo: string;
	};
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
	/** The number of snapshots created for this page */
	snapshotCount!: number;
	/** Always true for pages */
	persistent!: boolean;
	/** Array of lines in the page, where each line includes metadata like ID and text */
	lines!: {
		/** UUID of the line */
		id: string;
		/** Text of the line */
		text: string;
		/** User ID of the person who created the line */
		userId: string;
		/** Unix timestamp of when the line was created */
		created: number;
		/** Unix timestamp of when the line was last updated */
		updated: number;
	}[];
	/** List of forward links in the page */
	links!: string[];
	/** List of icons included in the page */
	icons!: string[];
	/** List of file URLs referenced in the page */
	files!: string[];
	/** Information about related pages (one-hop and two-hop links) */
	relatedPages!: {
		/** Direct related pages (1-hop links) */
		links1hop: RelatedPage[];
		/** Indirect related pages (2-hop links) */
		links2hop: RelatedPage[];
		/** Whether the page has backlinks or icons linking to it */
		hasBackLinksOrIcons: boolean;
	};
	/** List of collaborators on the page, excluding the creator and last updater */
	collaborators!: {
		/** User ID of the collaborator */
		id: string;
		/** Page name of the collaborator */
		name: string;
		/** Display name of the collaborator */
		displayName: string;
		/** URL to the collaborator's photo */
		photo: string;
	}[];
	/** The project this page belongs to */
	project: Project;

	/**
	 * Retrieves a new instance of the Page class.
	 * @param pageName The title of the page to fetch
	 * @param project The project to which the page belongs
	 * @returns A promise that resolves to a new Page instance
	 */
	static async new(
		pageName: string,
		project: Project,
	): Promise<Page> {
		return new Page(
			await (await project.client.fetch(
				`pages/${project.name}/${encodeURIComponent(pageName)}`,
			)).json(),
			project,
		);
	}

	/**
	 * Internal constructor used by the `new` method to create a page instance.
	 * @param init The initial data for the page
	 * @param project The project to which the page belongs
	 */
	private constructor(
		init: Page,
		project: Project,
	) {
		Object.assign(this, init);
		this.project = project;
		this.relatedPages.links1hop = init.relatedPages.links1hop.map(
			(relatedItem) => new RelatedPage(relatedItem, this),
		);
		this.relatedPages.links2hop = init.relatedPages.links2hop.map(
			(relatedItem) => new RelatedPage(relatedItem, this),
		);
	}
}
