import { PostgrestSingleResponse } from "@supabase/supabase-js";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Executes a Supabase query with retry logic for network errors.
 *
 * @param queryFn A function that returns a Supabase promise (like supabase.from(...).select())
 * @param retries Number of retries remaining (default: 3)
 * @param delay Delay before next retry in ms (default: 1000, increases exponentially)
 * @returns The data from the query
 * @throws The error from the query if all retries fail
 */
export async function fetchWithRetry<T>(
  queryFn: () => PromiseLike<
    PostgrestSingleResponse<T> | { data: T | null; error: any }
  >,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      // Execute the query
      const { data, error } = await queryFn();

      // If there's a Supabase error, throw it to be caught by the catch block
      // or handled immediately if it's not a retryable error (like 400 Bad Request)
      if (error) {
        // If it's a 4xx error (client error), don't retry, just throw
        // We assume 'code' property exists on PostgrestError
        if (error.code && error.code.startsWith("4")) {
          throw error;
        }

        // For other errors (like 500 or network issues), throw to trigger retry
        throw error;
      }

      return data;
    } catch (err: any) {
      // If it's the last attempt or a client error (that we re-threw above), throw the error
      if (i === retries - 1 || (err.code && err.code.startsWith("4"))) {
        console.error(`Query failed after ${i + 1} attempts:`, err);
        throw err;
      }

      // Wait before retrying
      console.warn(
        `Query failed (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`,
        err,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      delay *= 2;
    }
  }

  return null;
}
