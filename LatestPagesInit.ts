/** Options for querying the latest pages */
export interface LatestPagesInit {
    /**
     * Limit of elements to retrieve (min: 1, max: 1000).
     */
    limit?: number;

    /**
     * Number of elements to skip (useful for pagination).
     */
    skip?: number;

    /**
     * Sort method for the results. Can be one of:
     * - "updated"
     * - "created"
     * - "accessed"
     * - "linked"
     * - "views"
     * - "title"
     * - "updatedbyMe"
     */
    sort:
        | "updated"
        | "created"
        | "accessed"
        | "linked"
        | "views"
        | "title"
        | "updatedbyMe";
}