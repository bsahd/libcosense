import type {Project} from "./Project.ts"
import type {LatestPagesInit} from "./LatestPagesInit.ts"
import {Page} from "./Page.ts"

/** Class representing a single page in the latest pages result */
export class LatestPagesPage {
    /** ID of the page */
    id!: string;

    /** Title of the page */
    title!: string;

    /** URL to the page's thumbnail */
    image!: string | null;

    /** Descriptions of the page (first 5 lines excluding the title line) */
    descriptions!: string[];

    /** Creator of the page */
    user!: {
        /** User ID */
        id: string;
        /** User's page name */
        name: string;
        /** Display name of the user */
        displayName: string;
        /** URL to the user's icon */
        photo: string;
    };

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
     * **internal only:**
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
export class LatestPages {
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
        options: LatestPagesInit,
        project: Project,
    ): Promise<LatestPages> {
        return new LatestPages(
            await (await project.client.fetch(
                "pages/" +
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
