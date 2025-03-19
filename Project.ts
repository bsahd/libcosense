import { CosenseClient } from "./CosenseClient.ts";
import type { CosenseClientopts } from "./CosenseClientopts.ts";
import type { LatestPagesInit } from "./LatestPagesInit.ts";
import { LatestPages } from "./LatestPagesPage.ts";
import { Page } from "./Page.ts";
import { PageListItem } from "./PageListItem.ts";
import { SearchResult } from "./SearchResult.ts";

/** Class representing a Cosense project */
export class Project {
    /** Project UUID */
    id!: string;

    /**
     * Project URL (e.g., if the project URL is "https://scrapbox.io/example001", this is "example001").
     */
    name: string;

    /** Project display name */
    displayName!: string;

    /** Whether the project is publicly visible */
    publicVisible!: boolean;

    /** Login strategies used for the project */
    loginStrategies!: string[];

    /**
     * If the project is private, indicates the type: "personal" or "business".
     * If public, this is undefined.
     */
    plan?: string;

    /** Theme of the project */
    theme!: string;

    /** If the project uses Gyazo Teams, this is the Gyazo Teams name. Otherwise, it is null. */
    gyazoTeamsName!: string | null;

    /** Project favicon */
    image!: string | null;

    /** Whether translation is enabled */
    translation!: boolean;

    /** Whether infobox is enabled */
    infobox!: boolean;

    /** Unix timestamp when the project was created */
    created!: number;

    /** Unix timestamp when the project was last updated */
    updated!: number;

    /**
     * Whether the current user is a member of the project.
     * This is true if the user is logged in and a member of the project.
     */
    isMember!: boolean;

    /** The CosenseClient instance used by this project */
    client: CosenseClient;

    /**
     * Creates a new project reader.
     * @param projectName The name of the project (e.g., "example001" if the URL is "https://scrapbox.io/example001").
     * @param options Client options for authenticating.
     * @returns A Promise that resolves to a Project instance.
     */
    static async new(
        projectName: string,
        options: CosenseClientopts,
    ): Promise<Project> {
        const projectInformation =
            await (options.alternativeFetch ? options.alternativeFetch : fetch)(
                (typeof options.urlbase != "undefined"
                    ? options.urlbase
                    : "https://scrapbox.io/api/") +
                    "projects/" +
                    encodeURIComponent(projectName),
                options?.sessionid
                    ? {
                        headers: {
                            "Cookie:": "connect-sid=" + options.sessionid,
                        },
                    }
                    : {},
            );
        if (!projectInformation.ok) {
            throw new Error(await projectInformation.text());
        }
        return new Project(
            projectName,
            options,
            await projectInformation.json(),
        );
    }

    private constructor(
        name: string,
        options: CosenseClientopts,
        projectInfo: Project,
    ) {
        this.client = new CosenseClient(options);
        this.name = name;
        Object.assign(this, projectInfo);
    }

    /**
     * Fetches the list of all pages in the project.
     * @returns An async generator yielding each page in the project.
     */
    async *pageList(): AsyncGenerator<PageListItem, void, unknown> {
        let followId: string | null = null;
        while (true) {
            const partialPageListResponse: PageListItem[] =
                await (await this.client.fetch(
                    "pages/" +
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

    /**
     * Fetches the latest pages based on the specified options.
     * @param options Options for querying the latest pages.
     * @returns A Promise resolving to the latest pages result.
     */
    latestPages(options: LatestPagesInit): Promise<LatestPages> {
        return LatestPages.new(options, this);
    }

    /**
     * Fetches a single page by name.
     * @param pageName The name of the page.
     * @returns A Promise that resolves to the Page instance.
     */
    getPage(pageName: string): Promise<Page> {
        return Page.new(pageName, this);
    }

    /** Performs a full-text search across the project */
    search(query: string): Promise<SearchResult> {
        return SearchResult.new(query, this);
    }
}
