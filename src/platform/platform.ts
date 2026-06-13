export type Edition = "demo" | "full";

// TODO(M4/M12): Expand this into the web/desktop platform interface from plan/07 section 10.
export interface Platform {
  readonly edition: Edition;
}
